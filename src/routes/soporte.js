/**
 * HABITABOGOTÁ — /src/routes/soporte.js
 * Registro de consultas legales y soporte al usuario.
 */

import { Router } from 'express';
import { z } from 'zod';
import { isDatabaseConfigured, query } from '../db.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { formLimiter } from '../middleware/rateLimit.js';
import { sanitizeText, validateBody } from '../middleware/validate.js';
import { memoryStore } from '../services/memoryStore.js';

const router = Router();

const soporteSchema = z.object({
  nombre: z.preprocess(
    (v) => sanitizeText(v),
    z.string().min(2, 'Ingresa tu nombre completo.').max(120)
  ),
  correo: z.preprocess(
    (v) => sanitizeText(v).toLowerCase(),
    z.string().email('Ingresa un correo electrónico válido.').max(160)
  ),
  mensaje: z.preprocess(
    (v) => sanitizeText(v),
    z.string().min(8, 'Cuéntanos un poco más sobre tu consulta (mínimo 8 caracteres).').max(1500)
  )
});

// POST /api/soporte
router.post(
  '/',
  formLimiter,
  validateBody(soporteSchema),
  asyncHandler(async (req, res) => {
    const { nombre, correo, mensaje } = req.validatedBody;

    let id;
    if (!isDatabaseConfigured()) {
      const record = memoryStore.addSoporte(nombre, correo, mensaje);
      id = record.id;
    } else {
      const inserted = await query(
        'INSERT INTO mensajes_soporte (nombre, correo, mensaje) VALUES ($1, $2, $3) RETURNING id, creado_en',
        [nombre, correo, mensaje]
      );
      id = inserted.rows[0].id;
    }

    return res.status(201).json({
      ok: true,
      id,
      mensaje: `¡Gracias ${nombre}! Tu consulta ha sido radicada (#${id}). Te responderemos pronto.`
    });
  })
);

export default router;
