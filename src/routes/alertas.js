/**
 * HABITABOGOTÁ — /src/routes/alertas.js
 * Registro de alertas de búsqueda por correo electrónico.
 */

import { Router } from 'express';
import { z } from 'zod';
import { isDatabaseConfigured, query } from '../db.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { formLimiter } from '../middleware/rateLimit.js';
import { optionalSessionId, sanitizeText, validateBody } from '../middleware/validate.js';
import { memoryStore } from '../services/memoryStore.js';

const router = Router();

const alertaSchema = z.object({
  correo: z.preprocess(
    (v) => sanitizeText(v).toLowerCase(),
    z.string().email({ message: 'Ingresa un correo electrónico válido.' }).max(160)
  ),
  filtros: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).optional().default({})
});

// POST /api/alertas
router.post(
  '/',
  formLimiter,
  optionalSessionId,
  validateBody(alertaSchema),
  asyncHandler(async (req, res) => {
    const { correo, filtros } = req.validatedBody;

    let id;
    if (!isDatabaseConfigured()) {
      const record = memoryStore.addAlerta(req.sesionId, correo, filtros);
      id = record.id;
    } else {
      const inserted = await query(
        'INSERT INTO alertas (sesion_id, correo, filtros) VALUES ($1, $2, $3::jsonb) RETURNING id, creado_en',
        [req.sesionId, correo, JSON.stringify(filtros)]
      );
      id = inserted.rows[0].id;
    }

    return res.status(201).json({
      ok: true,
      id,
      mensaje: 'Alerta activada correctamente. Te notificaremos sobre nuevos inmuebles.'
    });
  })
);

export default router;
