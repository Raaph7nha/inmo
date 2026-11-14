/**
 * HABITABOGOTÁ — /src/routes/puntos-interes.js
 * Carga perezosa de puntos de interés (transporte, supermercados, riesgos).
 */

import { Router } from 'express';
import { query } from '../db.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// GET /api/puntos-interes
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const categoria = req.query.categoria ? String(req.query.categoria) : null;
    let sql = 'SELECT * FROM puntos_interes';
    const params = [];

    if (categoria) {
      sql += ' WHERE categoria = $1';
      params.push(categoria);
    }
    sql += ' ORDER BY id ASC';

    const result = await query(sql, params);
    return res.json({ ok: true, puntos: result.rows });
  })
);

export default router;
