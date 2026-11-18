/**
 * HABITABOGOTÁ — /src/routes/guardados.js
 * Favoritos persistidos por usuario autenticado (columnas exactas: usuario_id, vivienda_id, creado_en).
 * Usuarios no autenticados reciben siempre { ok: true, data: { ids: [], items: [] } }.
 */

import { Router } from 'express';
import { z } from 'zod';
import { isDatabaseConfigured, query } from '../db.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { optionalAuth } from '../middleware/auth.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import { getViviendasByIds } from '../services/viviendasQuery.js';
import { memoryStore } from '../services/memoryStore.js';

const router = Router();

const bodySchema = z.object({
  inmueble_id: z.coerce.number().int().positive().optional(),
  vivienda_id: z.coerce.number().int().positive().optional()
}).refine((d) => d.inmueble_id || d.vivienda_id, {
  message: 'Se requiere vivienda_id o inmueble_id.'
});

const paramSchema = z.object({
  inmuebleId: z.coerce.number().int().positive()
});

async function fetchUserSaved(userId) {
  let ids = [];
  if (!isDatabaseConfigured() || !userId) {
    ids = [];
  } else {
    try {
      const res = await query(
        'SELECT vivienda_id FROM guardados WHERE usuario_id = $1 ORDER BY creado_en DESC',
        [userId]
      );
      ids = res.rows.map((r) => Number(r.vivienda_id));
    } catch (err) {
      console.warn('Error fetching saved:', err.message);
      ids = [];
    }
  }
  const inmuebles = await getViviendasByIds(ids);
  return {
    ok: true,
    ids,
    inmuebles,
    items: inmuebles,
    data: {
      ids,
      items: inmuebles,
      inmuebles
    }
  };
}

// GET /api/guardados/diagnostico-guardados
router.get(
  '/diagnostico-guardados',
  asyncHandler(async (req, res) => {
    if (!isDatabaseConfigured()) {
      return res.json({ ok: true, message: 'DB not configured', guardados: [] });
    }
    const resDb = await query('SELECT * FROM guardados');
    return res.json({ ok: true, guardados: resDb.rows });
  })
);

router.use(optionalAuth);

// GET /api/guardados
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const userId = req.usuario?.id;
    console.log('[Guardados] GET /api/guardados usuario_id:', userId);
    if (!userId) {
      return res.json({
        ok: true,
        ids: [],
        inmuebles: [],
        items: [],
        data: { ids: [], items: [], inmuebles: [] }
      });
    }
    const data = await fetchUserSaved(userId);
    console.log('[Guardados] Respuesta /api/guardados:', JSON.stringify(data));
    return res.json(data);
  })
);

// POST /api/guardados
router.post(
  '/',
  optionalAuth,
  validateBody(bodySchema),
  asyncHandler(async (req, res) => {
    const inmueble_id = req.validatedBody.vivienda_id || req.validatedBody.inmueble_id;
    const userId = req.usuario?.id;

    if (!userId) {
      return res.json({
        ok: true,
        ids: [inmueble_id],
        inmuebles: [],
        items: [],
        data: { ids: [inmueble_id], items: [], inmuebles: [] }
      });
    }

    if (!isDatabaseConfigured()) {
      memoryStore.addGuardado(userId, inmueble_id);
      const data = await fetchUserSaved(userId);
      return res.status(201).json(data);
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
    return res.status(201).json(data);
  })
);

// DELETE /api/guardados (con body { vivienda_id } o { inmueble_id })
router.delete(
  '/',
  optionalAuth,
  validateBody(bodySchema),
  asyncHandler(async (req, res) => {
    const userId = req.usuario?.id;
    const viviendaId = req.validatedBody.vivienda_id || req.validatedBody.inmueble_id;

    if (!userId) {
      return res.json({
        ok: true,
        ids: [],
        inmuebles: [],
        items: [],
        data: { ids: [], items: [], inmuebles: [] }
      });
    }

    if (!isDatabaseConfigured()) {
      memoryStore.removeGuardado(userId, viviendaId);
      const data = await fetchUserSaved(userId);
      return res.json(data);
    }

    await query(
      'DELETE FROM guardados WHERE usuario_id = $1 AND vivienda_id = $2',
      [userId, viviendaId]
    );

    const data = await fetchUserSaved(userId);
    return res.json(data);
  })
);

// DELETE /api/guardados/:inmuebleId
router.delete(
  '/:inmuebleId',
  optionalAuth,
  validateParams(paramSchema),
  asyncHandler(async (req, res) => {
    const userId = req.usuario?.id;
    const viviendaId = req.validatedParams.inmuebleId;

    if (!userId) {
      return res.json({
        ok: true,
        ids: [],
        inmuebles: [],
        items: [],
        data: { ids: [], items: [], inmuebles: [] }
      });
    }

    if (!isDatabaseConfigured()) {
      memoryStore.removeGuardado(userId, viviendaId);
      const data = await fetchUserSaved(userId);
      return res.json(data);
    }

    await query(
      'DELETE FROM guardados WHERE usuario_id = $1 AND vivienda_id = $2',
      [userId, viviendaId]
    );

    const data = await fetchUserSaved(userId);
    return res.json(data);
  })
);

export default router;
