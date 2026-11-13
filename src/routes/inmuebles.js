/**
 * HABITABOGOTÁ — /src/routes/inmuebles.js
 * Endpoints REST de consulta y detalle de inmuebles desde Neon Postgres.
 */

import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { validateQuery, validateParams, sanitizeText } from '../middleware/validate.js';
import { searchInmuebles, getInmuebleById, getBarriosResumen } from '../services/inmueblesQuery.js';

const router = Router();

const emptyToUndefined = (v) => (v === '' || v === null || v === undefined ? undefined : v);

const optionalBool = z.preprocess((v) => {
  if (v === true || v === 'true' || v === '1') return true;
  if (v === false || v === 'false' || v === '0') return false;
  return undefined;
}, z.boolean().optional());

const optionalNonNegNum = z.preprocess(
  emptyToUndefined,
  z.coerce.number().nonnegative().optional()
);

const listQuerySchema = z.object({
  q: z.preprocess((v) => (typeof v === 'string' ? sanitizeText(v) : undefined), z.string().max(120).optional()),
  tipo: z.preprocess(emptyToUndefined, z.enum(['todos', 'casa', 'apartamento', 'local']).optional()),
  operacion: z.preprocess(emptyToUndefined, z.enum(['todos', 'arriendo', 'venta']).optional()),
  precio_min: optionalNonNegNum,
  precio_max: optionalNonNegNum,
  habitaciones: z.preprocess(emptyToUndefined, z.coerce.number().int().min(0).max(15).optional()),
  mascotas: optionalBool,
  parqueadero: optionalBool,
  balcon: optionalBool,
  gimnasio: optionalBool,
  piscina: optionalBool,
  porteria: optionalBool,
  tour_3d: optionalBool,
  orden: z.preprocess(emptyToUndefined, z.enum(['costo_asc', 'costo_desc', 'recientes', 'area_desc']).optional()),
  pagina: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).max(1000).optional()),
  limite: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).max(50).optional())
});

const idParamSchema = z.object({
  id: z.coerce.number().int().positive()
});

// GET /api/inmuebles
router.get(
  '/',
  validateQuery(listQuerySchema),
  asyncHandler(async (req, res) => {
    const q = req.validatedQuery;
    const [result, barrios] = await Promise.all([
      searchInmuebles(q),
      getBarriosResumen()
    ]);

    return res.json({
      inmuebles: result.inmuebles,
      total: result.total,
      pagina: result.pagina,
      limite: result.limite,
      barrios
    });
  })
);

// GET /api/inmuebles/:id
router.get(
  '/:id',
  validateParams(idParamSchema),
  asyncHandler(async (req, res) => {
    const item = await getInmuebleById(req.validatedParams.id);
    if (!item) {
      throw new AppError('No encontramos el inmueble solicitado.', 404, 'PROPERTY_NOT_FOUND');
    }
    return res.json({ inmueble: item });
  })
);

export default router;
