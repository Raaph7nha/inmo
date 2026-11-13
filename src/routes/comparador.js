/**
 * HABITABOGOTÁ — /src/routes/comparador.js
 * Comparador persistido por sesión (máximo 3 inmuebles validado en el servidor).
 */

import { Router } from 'express';
import { z } from 'zod';
import { isDatabaseConfigured, query, withTransaction } from '../db.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { requireSessionId, validateBody, validateParams } from '../middleware/validate.js';
import { getInmueblesByIds } from '../services/inmueblesQuery.js';
import { memoryStore } from '../services/memoryStore.js';

const router = Router();
const MAX_COMPARE = 3;

const bodySchema = z.object({
  inmueble_id: z.coerce.number().int().positive()
});

const paramSchema = z.object({
  inmuebleId: z.coerce.number().int().positive()
});

async function fetchSessionCompare(sesionId) {
  let ids;
  if (!isDatabaseConfigured()) {
    ids = memoryStore.getComparadorIds(sesionId);
  } else {
    const res = await query(
      'SELECT inmueble_id FROM comparador WHERE sesion_id = $1 ORDER BY creado_en ASC',
      [sesionId]
    );
    ids = res.rows.map((r) => Number(r.inmueble_id));
  }
  const inmuebles = await getInmueblesByIds(ids);
  return { ids, inmuebles };
}

router.use(requireSessionId);

// GET /api/comparador
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const data = await fetchSessionCompare(req.sesionId);
    return res.json(data);
  })
);

// POST /api/comparador
router.post(
  '/',
  validateBody(bodySchema),
  asyncHandler(async (req, res) => {
    const { inmueble_id } = req.validatedBody;

    if (!isDatabaseConfigured()) {
      if (!memoryStore.getInmuebleById(inmueble_id)) {
        throw new AppError('El inmueble no existe.', 404, 'PROPERTY_NOT_FOUND');
      }
      const { status } = memoryStore.addComparador(req.sesionId, inmueble_id);
      const data = await fetchSessionCompare(req.sesionId);
      return res.status(status).json({ ok: true, ...data });
    }

    const exists = await query('SELECT id FROM inmuebles WHERE id = $1', [inmueble_id]);
    if (!exists.rows.length) {
      throw new AppError('El inmueble no existe.', 404, 'PROPERTY_NOT_FOUND');
    }

    const status = await withTransaction(async (client) => {
      // Bloquear filas de la sesión para validar máximo 3 de forma atómica
      const currentRes = await client.query(
        'SELECT inmueble_id FROM comparador WHERE sesion_id = $1 FOR UPDATE',
        [req.sesionId]
      );
      const currentIds = currentRes.rows.map((r) => Number(r.inmueble_id));

      if (currentIds.includes(inmueble_id)) {
        return 200;
      }

      if (currentIds.length >= MAX_COMPARE) {
        throw new AppError(
          'Solo puedes comparar hasta 3 inmuebles simultáneos para conservar una tabla legible.',
          400,
          'COMPARE_LIMIT_REACHED'
        );
      }

      await client.query(
        'INSERT INTO comparador (sesion_id, inmueble_id) VALUES ($1, $2)',
        [req.sesionId, inmueble_id]
      );
      return 201;
    });

    const data = await fetchSessionCompare(req.sesionId);
    return res.status(status).json({ ok: true, ...data });
  })
);

// DELETE /api/comparador (vaciar todo el comparador de la sesión)
router.delete(
  '/',
  asyncHandler(async (req, res) => {
    if (!isDatabaseConfigured()) {
      memoryStore.clearComparador(req.sesionId);
      return res.json({ ok: true, ids: [], inmuebles: [] });
    }
    await query('DELETE FROM comparador WHERE sesion_id = $1', [req.sesionId]);
    return res.json({ ok: true, ids: [], inmuebles: [] });
  })
);

// DELETE /api/comparador/:inmuebleId
router.delete(
  '/:inmuebleId',
  validateParams(paramSchema),
  asyncHandler(async (req, res) => {
    if (!isDatabaseConfigured()) {
      memoryStore.removeComparador(req.sesionId, req.validatedParams.inmuebleId);
      const data = await fetchSessionCompare(req.sesionId);
      return res.json({ ok: true, ...data });
    }
    await query(
      'DELETE FROM comparador WHERE sesion_id = $1 AND inmueble_id = $2',
      [req.sesionId, req.validatedParams.inmuebleId]
    );
    const data = await fetchSessionCompare(req.sesionId);
    return res.json({ ok: true, ...data });
  })
);

export default router;
