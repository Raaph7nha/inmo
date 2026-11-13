/**
 * HABITABOGOTÁ — /src/routes/chat.js
 * Endpoint POST /api/chat conectado a Groq + tool calling + persistencia en chat_mensajes.
 */

import { Router } from 'express';
import { z } from 'zod';
import { isDatabaseConfigured, query } from '../db.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { chatLimiter } from '../middleware/rateLimit.js';
import { requireSessionId, sanitizeText, validateBody } from '../middleware/validate.js';
import { runChatAssistant } from '../services/groq.js';
import { memoryStore } from '../services/memoryStore.js';

const router = Router();

const historyItemSchema = z.object({
  rol: z.enum(['user', 'assistant']),
  contenido: z.preprocess((v) => sanitizeText(v), z.string().min(1).max(1200))
});

const chatBodySchema = z.object({
  mensaje: z.preprocess(
    (v) => sanitizeText(v),
    z.string()
      .min(1, 'Escribe una pregunta para Habi.')
      .max(500, 'El mensaje no puede superar los 500 caracteres.')
  ),
  historial: z.array(historyItemSchema).max(10).optional().default([])
});

// POST /api/chat
router.post(
  '/',
  chatLimiter,
  validateBody(chatBodySchema),
  requireSessionId,
  asyncHandler(async (req, res) => {
    const { mensaje, historial } = req.validatedBody;
    const sesionId = req.sesionId;
    const usePg = isDatabaseConfigured();

    // 1. Obtener IDs guardados de esta sesión para responder "Compara mis guardados"
    let guardadosIds;
    if (!usePg) {
      guardadosIds = memoryStore.getGuardadosIds(sesionId);
    } else {
      const savedRes = await query(
        'SELECT inmueble_id FROM guardados WHERE sesion_id = $1 ORDER BY creado_en DESC',
        [sesionId]
      );
      guardadosIds = savedRes.rows.map((r) => Number(r.inmueble_id));
    }

    // 2. Guardar el turno del usuario
    if (!usePg) {
      memoryStore.addChatMensaje(sesionId, 'user', mensaje, []);
    } else {
      await query(
        'INSERT INTO chat_mensajes (sesion_id, rol, contenido, inmuebles_ids) VALUES ($1, $2, $3, $4)',
        [sesionId, 'user', mensaje, []]
      );
    }

    // 3. Ejecutar asistente Groq con bucle de herramientas
    const aiResult = await runChatAssistant({
      mensaje,
      historial,
      guardadosIds
    });

    const recommendedIds = aiResult.inmuebles.map((x) => x.id);

    // 4. Guardar respuesta del asistente
    if (!usePg) {
      memoryStore.addChatMensaje(sesionId, 'assistant', aiResult.respuesta, recommendedIds);
    } else {
      await query(
        'INSERT INTO chat_mensajes (sesion_id, rol, contenido, inmuebles_ids) VALUES ($1, $2, $3, $4)',
        [sesionId, 'assistant', aiResult.respuesta, recommendedIds]
      );
    }

    return res.json({
      respuesta: aiResult.respuesta,
      inmuebles: aiResult.inmuebles,
      filtros_sugeridos: aiResult.filtros_sugeridos
    });
  })
);

export default router;
