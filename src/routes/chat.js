/**
 * HABITABOGOTÁ — /src/routes/chat.js
 * Endpoint POST /api/chat conectado a Groq + tool calling + persistencia en chat_mensajes.
 */

import { Router } from 'express';
import { z } from 'zod';
import { isDatabaseConfigured, query } from '../db.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { chatLimiter } from '../middleware/rateLimit.js';
import { optionalAuth } from '../middleware/auth.js';
import { sanitizeText, validateBody } from '../middleware/validate.js';
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
  optionalAuth,
  validateBody(chatBodySchema),
  asyncHandler(async (req, res) => {
    const { mensaje, historial } = req.validatedBody;
    const userId = req.usuario?.id || null;
    const usePg = isDatabaseConfigured();

    // 1. Obtener IDs guardados si el usuario está autenticado
    let guardadosIds = [];
    if (userId) {
      if (!usePg) {
        guardadosIds = memoryStore.getGuardadosIds(userId);
      } else {
        const savedRes = await query(
          'SELECT vivienda_id FROM guardados WHERE usuario_id = $1 ORDER BY creado_en DESC',
          [userId]
        );
        guardadosIds = savedRes.rows.map((r) => Number(r.vivienda_id));
      }
    }

    // 2. Guardar el turno del usuario si hay usuario
    if (userId && usePg) {
      await query(
        'INSERT INTO chat_mensajes (usuario_id, rol, contenido, viviendas_ids) VALUES ($1, $2, $3, $4)',
        [userId, 'user', mensaje, []]
      );
    }

    // 3. Ejecutar asistente Groq con bucle de herramientas
    const aiResult = await runChatAssistant({
      mensaje,
      historial,
      guardadosIds
    });

    const recommendedIds = aiResult.viviendas.map((x) => x.id);

    // 4. Guardar respuesta del asistente
    if (userId && usePg) {
      await query(
        'INSERT INTO chat_mensajes (usuario_id, rol, contenido, viviendas_ids) VALUES ($1, $2, $3, $4)',
        [userId, 'assistant', aiResult.respuesta, recommendedIds]
      );
    }

    return res.json({
      respuesta: aiResult.respuesta,
      viviendas: aiResult.viviendas,
      filtros_sugeridos: aiResult.filtros_sugeridos
    });
  })
);

export default router;
