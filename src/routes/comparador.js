/**
 * HABITABOGOTÁ — /src/routes/comparador.js
 * Comparador persistido por usuario autenticado (máximo 3 viviendas).
 */

import { Router } from 'express';
import { z } from 'zod';
import { isDatabaseConfigured, query, withTransaction } from '../db.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import { getViviendasByIds } from '../services/viviendasQuery.js';
import { memoryStore } from '../services/memoryStore.js';

const router = Router();
const MAX_COMPARE = 3;

const bodySchema = z.object({
  inmueble_id: z.coerce.number().int().positive()
});

const paramSchema = z.object({
  inmuebleId: z.coerce.number().int().positive()
});

async function fetchUserCompare(userId) {
  let ids;
  if (!isDatabaseConfigured()) {
    ids = memoryStore.getComparadorIds(userId);
  } else {
    const res = await query(
      'SELECT vivienda_id FROM comparador WHERE usuario_id = $1 ORDER BY creado_en ASC',
      [userId]
    );
    ids = res.rows.map((r) => Number(r.vivienda_id));
  }
  const inmuebles = await getViviendasByIds(ids);
  return { ids, inmuebles };
}

router.use(optionalAuth);

// GET /api/comparador
router.get(
  '/',
  asyncHandler(async (req, res) => {
    if (!req.usuario) {
      return res.json({ ids: [], inmuebles: [] });
    }
    const data = await fetchUserCompare(req.usuario.id);
    return res.json(data);
  })
);

// POST /api/comparador
router.post(
  '/',
  requireAuth,
  validateBody(bodySchema),
  asyncHandler(async (req, res) => {
    const { inmueble_id } = req.validatedBody;
    const userId = req.usuario.id;

    if (!isDatabaseConfigured()) {
      if (!memoryStore.getViviendaById(inmueble_id)) {
        throw new AppError('La vivienda no existe.', 404, 'PROPERTY_NOT_FOUND');
      }
      const { status } = memoryStore.addComparador(userId, inmueble_id);
      const data = await fetchUserCompare(userId);
      return res.status(status).json({ ok: true, ...data });
    }

    const exists = await query('SELECT id FROM viviendas WHERE id = $1', [inmueble_id]);
    if (!exists.rows.length) {
      throw new AppError('La vivienda no existe.', 404, 'PROPERTY_NOT_FOUND');
    }

    const status = await withTransaction(async (client) => {
      const currentRes = await client.query(
        'SELECT vivienda_id FROM comparador WHERE usuario_id = $1 FOR UPDATE',
        [userId]
      );
      const currentIds = currentRes.rows.map((r) => Number(r.vivienda_id));

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
        'INSERT INTO comparador (usuario_id, vivienda_id) VALUES ($1, $2)',
        [userId, inmueble_id]
      );
      return 201;
    });

    const data = await fetchUserCompare(userId);
    return res.status(status).json({ ok: true, ...data });
  })
);

// DELETE /api/comparador
router.delete(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.usuario.id;
    if (!isDatabaseConfigured()) {
      memoryStore.clearComparador(userId);
      return res.json({ ok: true, ids: [], inmuebles: [] });
    }
    await query('DELETE FROM comparador WHERE usuario_id = $1', [userId]);
    return res.json({ ok: true, ids: [], inmuebles: [] });
  })
);

// DELETE /api/comparador/:inmuebleId
router.delete(
  '/:inmuebleId',
  requireAuth,
  validateParams(paramSchema),
  asyncHandler(async (req, res) => {
    const userId = req.usuario.id;
    const viviendaId = req.validatedParams.inmuebleId;

    if (!isDatabaseConfigured()) {
      memoryStore.removeComparador(userId, viviendaId);
      const data = await fetchUserCompare(userId);
      return res.json({ ok: true, ...data });
    }

    await query(
      'DELETE FROM comparador WHERE usuario_id = $1 AND vivienda_id = $2',
      [userId, viviendaId]
    );

    const data = await fetchUserCompare(userId);
    return res.json({ ok: true, ...data });
  })
);

export default router;
