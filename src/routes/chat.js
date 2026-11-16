/**
 * HABITABOGOTÁ — /src/routes/chat.js
 * Endpoint POST /api/chat conectado a Groq + tool calling + persistencia en chat_mensajes.
 */

import { Router } from 'express';
import { z } from 'zod';
import { isDatabaseConfigured, query } from '../db.js';
import { chatLimiter } from '../middleware/rateLimit.js';
import { optionalAuth } from '../middleware/auth.js';
import { sanitizeText } from '../middleware/validate.js';
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
router.post('/', chatLimiter, optionalAuth, async (req, res) => {
  try {
    const parsed = chatBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        ok: false,
        respuesta: parsed.error.issues[0]?.message || 'Escribe una pregunta válida para Habi.',
        inmuebles: []
      });
    }

    const { mensaje, historial } = parsed.data;
    const userId = req.usuario?.id || null;
    const usePg = isDatabaseConfigured();

    console.log('[Chat] Mensaje recibido:', mensaje);
    console.log('[Chat] Modelo:', process.env.GROQ_MODEL);

    // 1. Obtener IDs y objetos guardados si el usuario está autenticado
    let guardadosIds = [];
    let viviendasGuardadas = [];
    if (userId) {
      try {
        if (!usePg) {
          guardadosIds = memoryStore.getGuardadosIds(userId);
          viviendasGuardadas = memoryStore.getInmueblesByIds(guardadosIds);
        } else {
          const savedRes = await query(
            'SELECT v.* FROM guardados g JOIN viviendas v ON v.id = g.vivienda_id WHERE g.usuario_id = $1 ORDER BY g.creado_en DESC',
            [userId]
          );
          viviendasGuardadas = savedRes.rows;
          guardadosIds = viviendasGuardadas.map((r) => Number(r.id));
        }
      } catch (dbErr) {
        console.error('[Chat] Error leyendo guardados:', dbErr.message);
      }
    }

    // 2. Guardar el turno del usuario si hay usuario
    if (userId && usePg) {
      try {
        await query(
          'INSERT INTO chat_mensajes (usuario_id, rol, contenido, viviendas_ids) VALUES ($1, $2, $3, $4)',
          [userId, 'user', mensaje, []]
        );
      } catch (dbErr) {
        console.error('[Chat] Error guardando mensaje usuario:', dbErr.message);
      }
    }

    // 3. Ejecutar asistente Groq con bucle de herramientas y fallback simple
    const aiResult = await runChatAssistant({
      mensaje,
      historial,
      guardadosIds,
      viviendasGuardadas
    });

    const respuesta = aiResult?.respuesta || '';
    const inmuebles = Array.isArray(aiResult?.inmuebles) ? aiResult.inmuebles : [];
    const recommendedIds = inmuebles.map((x) => x.id);

    console.log('[Chat] Respuesta Groq:', JSON.stringify(respuesta));

    // 4. Guardar respuesta del asistente
    if (userId && usePg) {
      try {
        await query(
          'INSERT INTO chat_mensajes (usuario_id, rol, contenido, viviendas_ids) VALUES ($1, $2, $3, $4)',
          [userId, 'assistant', respuesta, recommendedIds]
        );
      } catch (dbErr) {
        console.error('[Chat] Error guardando respuesta asistente:', dbErr.message);
      }
    }

    return res.json({
      ok: true,
      respuesta,
      inmuebles,
      filtros_sugeridos: aiResult?.filtros_sugeridos || {}
    });
  } catch (error) {
    console.error('[Chat] Error completo:', error.message, error.stack);
    return res.json({ ok: false, respuesta: 'Error interno', inmuebles: [] });
  }
});

export default router;
