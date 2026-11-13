/**
 * HABITABOGOTÁ — /src/routes/guardados.js
 * Favoritos persistidos en Postgres por identificador de sesión (X-Sesion-Id).
 */

import { Router } from 'express';
import { z } from 'zod';
import { isDatabaseConfigured, query } from '../db.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { requireSessionId, validateBody, validateParams } from '../middleware/validate.js';
import { getInmueblesByIds } from '../services/inmueblesQuery.js';
import { memoryStore } from '../services/memoryStore.js';

const router = Router();

const bodySchema = z.object({
  inmueble_id: z.coerce.number().int().positive()
});

const paramSchema = z.object({
  inmuebleId: z.coerce.number().int().positive()
});

async function fetchSessionSaved(sesionId) {
  let ids;
  if (!isDatabaseConfigured()) {
    ids = memoryStore.getGuardadosIds(sesionId);
  } else {
    const res = await query(
      'SELECT inmueble_id FROM guardados WHERE sesion_id = $1 ORDER BY creado_en DESC',
      [sesionId]
    );
    ids = res.rows.map((r) => Number(r.inmueble_id));
  }
  const inmuebles = await getInmueblesByIds(ids);
  return { ids, inmuebles };
}

router.use(requireSessionId);

// GET /api/guardados
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const data = await fetchSessionSaved(req.sesionId);
    return res.json(data);
  })
);

// POST /api/guardados
router.post(
  '/',
  validateBody(bodySchema),
  asyncHandler(async (req, res) => {
    const { inmueble_id } = req.validatedBody;

    if (!isDatabaseConfigured()) {
      if (!memoryStore.getInmuebleById(inmueble_id)) {
        throw new AppError('El inmueble no existe.', 404, 'PROPERTY_NOT_FOUND');
      }
      memoryStore.addGuardado(req.sesionId, inmueble_id);
      const data = await fetchSessionSaved(req.sesionId);
      return res.status(201).json({ ok: true, ...data });
    }

    const exists = await query('SELECT id FROM inmuebles WHERE id = $1', [inmueble_id]);
    if (!exists.rows.length) {
      throw new AppError('El inmueble no existe.', 404, 'PROPERTY_NOT_FOUND');
    }

    await query(
      'INSERT INTO guardados (sesion_id, inmueble_id) VALUES ($1, $2) ON CONFLICT (sesion_id, inmueble_id) DO NOTHING',
      [req.sesionId, inmueble_id]
    );

    const data = await fetchSessionSaved(req.sesionId);
    return res.status(201).json({ ok: true, ...data });
  })
);

// DELETE /api/guardados/:inmuebleId
router.delete(
  '/:inmuebleId',
  validateParams(paramSchema),
  asyncHandler(async (req, res) => {
    if (!isDatabaseConfigured()) {
      memoryStore.removeGuardado(req.sesionId, req.validatedParams.inmuebleId);
      const data = await fetchSessionSaved(req.sesionId);
      return res.json({ ok: true, ...data });
    }

    await query(
      'DELETE FROM guardados WHERE sesion_id = $1 AND inmueble_id = $2',
      [req.sesionId, req.validatedParams.inmuebleId]
    );

    const data = await fetchSessionSaved(req.sesionId);
    return res.json({ ok: true, ...data });
  })
);

export default router;
