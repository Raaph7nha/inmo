/**
 * HABITABOGOTÁ — /src/routes/guardados.js
 * Favoritos persistidos por usuario autenticado.
 */

import { Router } from 'express';
import { z } from 'zod';
import { isDatabaseConfigured, query } from '../db.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import { getViviendasByIds } from '../services/viviendasQuery.js';
import { memoryStore } from '../services/memoryStore.js';

const router = Router();

const bodySchema = z.object({
  inmueble_id: z.coerce.number().int().positive()
});

const paramSchema = z.object({
  inmuebleId: z.coerce.number().int().positive()
});

async function fetchUserSaved(userId) {
  let ids;
  if (!isDatabaseConfigured()) {
    ids = memoryStore.getGuardadosIds(userId);
  } else {
    const res = await query(
      'SELECT vivienda_id FROM guardados WHERE usuario_id = $1 ORDER BY creado_en DESC',
      [userId]
    );
    ids = res.rows.map((r) => Number(r.vivienda_id));
  }
  const inmuebles = await getViviendasByIds(ids);
  return { ids, inmuebles };
}

router.use(optionalAuth);

// GET /api/guardados
router.get(
  '/',
  asyncHandler(async (req, res) => {
    if (!req.usuario) {
      return res.json({ ids: [], inmuebles: [] });
    }
    const data = await fetchUserSaved(req.usuario.id);
    return res.json(data);
  })
);

// POST /api/guardados
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
      memoryStore.addGuardado(userId, inmueble_id);
      const data = await fetchUserSaved(userId);
      return res.status(201).json({ ok: true, ...data });
    }

    const exists = await query('SELECT id FROM viviendas WHERE id = $1', [inmueble_id]);
    if (!exists.rows.length) {
      throw new AppError('La vivienda no existe.', 404, 'PROPERTY_NOT_FOUND');
    }

    await query(
      'INSERT INTO guardados (usuario_id, vivienda_id) VALUES ($1, $2) ON CONFLICT (usuario_id, vivienda_id) DO NOTHING',
      [userId, inmueble_id]
    );

    const data = await fetchUserSaved(userId);
    return res.status(201).json({ ok: true, ...data });
  })
);

// DELETE /api/guardados/:inmuebleId
router.delete(
  '/:inmuebleId',
  requireAuth,
  validateParams(paramSchema),
  asyncHandler(async (req, res) => {
    const userId = req.usuario.id;
    const viviendaId = req.validatedParams.inmuebleId;

    if (!isDatabaseConfigured()) {
      memoryStore.removeGuardado(userId, viviendaId);
      const data = await fetchUserSaved(userId);
      return res.json({ ok: true, ...data });
    }

    await query(
      'DELETE FROM guardados WHERE usuario_id = $1 AND vivienda_id = $2',
      [userId, viviendaId]
    );

    const data = await fetchUserSaved(userId);
    return res.json({ ok: true, ...data });
  })
);

export default router;
