/**
 * HABITABOGOTÁ — /src/routes/alertas.js
 * Registro de alertas de búsqueda por correo electrónico por usuario autenticado.
 */

import { Router } from 'express';
import { z } from 'zod';
import { isDatabaseConfigured, query } from '../db.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { formLimiter } from '../middleware/rateLimit.js';
import { sanitizeText, validateBody } from '../middleware/validate.js';
import { memoryStore } from '../services/memoryStore.js';

const router = Router();

const alertaSchema = z.object({
  correo: z.preprocess(
    (v) => sanitizeText(v).toLowerCase(),
    z.string().email({ message: 'Ingresa un correo electrónico válido.' }).max(255)
  ),
  filtros: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).optional().default({})
});

// POST /api/alertas
router.post(
  '/',
  requireAuth,
  formLimiter,
  validateBody(alertaSchema),
  asyncHandler(async (req, res) => {
    const { correo, filtros } = req.validatedBody;
    const userId = req.usuario.id;

    let id;
    if (!isDatabaseConfigured()) {
      id = 1;
    } else {
      const inserted = await query(
        'INSERT INTO alertas (usuario_id, correo, filtros) VALUES ($1, $2, $3::jsonb) RETURNING id',
        [userId, correo, JSON.stringify(filtros)]
      );
      id = inserted.rows[0].id;
    }

    return res.status(201).json({
      ok: true,
      id,
      mensaje: 'Alerta activada correctamente. Te notificaremos sobre nuevas viviendas.'
    });
  })
);

export default router;
