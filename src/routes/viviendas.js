/**
 * HABITABOGOTÁ — /src/routes/viviendas.js
 * Endpoints CRUD de viviendas, publicación con validación Zod, gestión propia y admin.
 */

import { Router } from 'express';
import { z } from 'zod';
import { query, withTransaction, isDatabaseConfigured } from '../db.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { validateQuery, validateParams, validateBody, sanitizeText } from '../middleware/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { searchViviendas, getViviendaById, getBarriosResumen } from '../services/viviendasQuery.js';
import { destroyCloudinaryAsset } from '../services/cloudinary.js';

const router = Router();

const emptyToUndefined = (v) => (v === '' || v === null || v === undefined ? undefined : v);

const optionalBool = z.preprocess((v) => {
  if (v === true || v === 'true' || v === '1') return true;
  if (v === false || v === 'false' || v === '0') return false;
  return undefined;
}, z.boolean().optional());

const optionalNonNegNum = z.preprocess(emptyToUndefined, z.coerce.number().nonnegative().optional());

const listQuerySchema = z.object({
  q: z.preprocess((v) => (typeof v === 'string' ? sanitizeText(v) : undefined), z.string().max(120).optional()),
  tipo: z.preprocess(emptyToUndefined, z.enum(['todos', 'casa', 'apartamento', 'local', 'otro']).optional()),
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

const imgParamSchema = z.object({
  id: z.coerce.number().int().positive(),
  imgId: z.coerce.number().int().positive()
});

const imagenViviendaSchema = z.object({
  cloudinary_public_id: z.string().min(1),
  url: z.string().url(),
  url_thumb: z.string().url().optional().nullable(),
  orden: z.number().int().min(0).optional().default(0)
});

const puntoInteresSchema = z.object({
  categoria: z.enum(['transporte', 'supermercado', 'zona_riesgo', 'colegio', 'hospital', 'parque']),
  nombre: z.string().min(1).max(120),
  lat: z.coerce.number().min(-90).max(90).optional().nullable(),
  lng: z.coerce.number().min(-180).max(180).optional().nullable(),
  distancia_cuadras: z.coerce.number().int().min(0).max(100)
});

const publicarViviendaSchema = z.object({
  titulo: z.preprocess((v) => sanitizeText(v), z.string().min(5).max(200)),
  descripcion: z.preprocess((v) => sanitizeText(v), z.string().min(10).max(3000)),
  tipo: z.enum(['casa', 'apartamento', 'local', 'otro']),
  operacion: z.enum(['arriendo', 'venta']),
  barrio: z.preprocess((v) => sanitizeText(v), z.string().min(2).max(100)),
  localidad: z.preprocess((v) => sanitizeText(v), z.string().min(2).max(100)),
  direccion_aprox: z.preprocess((v) => sanitizeText(v), z.string().min(3).max(200)),
  precio: z.coerce.number().positive(),
  administracion: z.coerce.number().nonnegative().optional().default(0),
  deposito: z.coerce.number().nonnegative().optional().nullable(),
  habitaciones: z.coerce.number().int().min(0).max(20).optional().default(1),
  banos: z.coerce.number().int().min(1).max(20).optional().default(1),
  area_m2: z.coerce.number().positive(),
  mascotas: z.boolean().optional().default(false),
  parqueadero: z.boolean().optional().default(false),
  balcon: z.boolean().optional().default(false),
  gimnasio: z.boolean().optional().default(false),
  piscina: z.boolean().optional().default(false),
  porteria: z.boolean().optional().default(false),
  tour_3d: z.boolean().optional().default(false),
  requisitos: z.array(z.string()).optional().default([]),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  imagenes: z.array(imagenViviendaSchema).min(1, 'Agrega al menos una imagen.').max(10, 'Máximo 10 imágenes.'),
  puntos_interes: z.array(puntoInteresSchema).optional().default([])
});

// GET /api/viviendas
router.get(
  '/',
  validateQuery(listQuerySchema),
  asyncHandler(async (req, res) => {
    const q = req.validatedQuery;
    const [result, barrios] = await Promise.all([
      searchViviendas(q),
      getBarriosResumen()
    ]);

    return res.json({
      ok: true,
      data: result.viviendas,
      total: result.total,
      pagina: result.pagina,
      limite: result.limite,
      barrios
    });
  })
);

// GET /api/viviendas/mias (requiere auth)
router.get(
  '/mias',
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!isDatabaseConfigured()) {
      return res.json({ viviendas: [] });
    }
    const sql = `
      SELECT
        v.*,
        (SELECT COUNT(*)::int FROM guardados g WHERE g.vivienda_id = v.id) AS veces_guardada,
        COALESCE(
          (
            SELECT json_agg(img.url ORDER BY img.orden ASC)
            FROM imagenes_vivienda img
            WHERE img.vivienda_id = v.id
          ),
          '[]'::json
        ) AS imagenes
      FROM viviendas v
      WHERE v.propietario_id = $1
      ORDER BY v.creado_en DESC
    `;
    const resDb = await query(sql, [req.usuario.id]);
    return res.json({ viviendas: resDb.rows });
  })
);

// GET /api/viviendas/:id
router.get(
  '/:id',
  validateParams(idParamSchema),
  asyncHandler(async (req, res) => {
    const item = await getViviendaById(req.validatedParams.id);
    if (!item) {
      throw new AppError('No encontramos la vivienda solicitada.', 404, 'PROPERTY_NOT_FOUND');
    }
    console.log('[Detalle] Datos enviados al frontend:', JSON.stringify(item));
    return res.json({ ok: true, data: item, vivienda: item });
  })
);

// POST /api/viviendas (publicar, requiere auth)
router.post(
  '/',
  requireAuth,
  validateBody(publicarViviendaSchema),
  asyncHandler(async (req, res) => {
    const data = req.validatedBody;
    const propietarioId = req.usuario.id;

    if (!isDatabaseConfigured()) {
      throw new AppError('La publicación requiere base de datos configurada en producción.', 503, 'DB_REQUIRED');
    }

    const viviendaCreada = await withTransaction(async (client) => {
      const vRes = await client.query(
        `INSERT INTO viviendas (
          propietario_id, titulo, descripcion, tipo, operacion, barrio, localidad, direccion_aprox,
          precio, administracion, deposito, habitaciones, banos, area_m2,
          mascotas, parqueadero, balcon, gimnasio, piscina, porteria, tour_3d,
          requisitos, lat, lng, pos_x, pos_y, destacado, activo
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, 50, 50, false, true)
        RETURNING *`,
        [
          propietarioId, data.titulo, data.descripcion, data.tipo, data.operacion,
          data.barrio, data.localidad, data.direccion_aprox, data.precio,
          data.administracion || 0, data.deposito || null, data.habitaciones || 1,
          data.banos || 1, data.area_m2, data.mascotas, data.parqueadero,
          data.balcon, data.gimnasio, data.piscina, data.porteria, data.tour_3d,
          data.requisitos || [], data.lat, data.lng
        ]
      );
      const vivienda = vRes.rows[0];

      for (let i = 0; i < data.imagenes.length; i++) {
        const img = data.imagenes[i];
        await client.query(
          'INSERT INTO imagenes_vivienda (vivienda_id, cloudinary_public_id, url, url_thumb, orden) VALUES ($1, $2, $3, $4, $5)',
          [vivienda.id, img.cloudinary_public_id, img.url, img.url_thumb || img.url, img.orden ?? i]
        );
      }

      for (const poi of data.puntos_interes) {
        await client.query(
          'INSERT INTO puntos_interes (vivienda_id, categoria, nombre, lat, lng, distancia_cuadras) VALUES ($1, $2, $3, $4, $5, $6)',
          [vivienda.id, poi.categoria, poi.nombre, poi.lat || data.lat, poi.lng || data.lng, poi.distancia_cuadras]
        );
      }

      return vivienda;
    });

    const viviendaCompleta = await getViviendaById(viviendaCreada.id);
    return res.status(201).json({ ok: true, vivienda: viviendaCompleta });
  })
);

// DELETE /api/viviendas/:id/imagenes/:imgId (propietario o admin)
router.delete(
  '/:id/imagenes/:imgId',
  requireAuth,
  validateParams(imgParamSchema),
  asyncHandler(async (req, res) => {
    const { id, imgId } = req.validatedParams;

    const vRes = await query('SELECT propietario_id FROM viviendas WHERE id = $1 LIMIT 1', [id]);
    if (!vRes.rows.length) {
      throw new AppError('Vivienda no encontrada.', 404, 'NOT_FOUND');
    }
    const vivienda = vRes.rows[0];
    if (vivienda.propietario_id !== req.usuario.id && req.usuario.rol !== 'admin') {
      throw new AppError('No autorizado para modificar esta vivienda.', 403, 'FORBIDDEN');
    }

    const imgRes = await query('SELECT cloudinary_public_id FROM imagenes_vivienda WHERE id = $1 AND vivienda_id = $2 LIMIT 1', [imgId, id]);
    if (!imgRes.rows.length) {
      throw new AppError('Imagen no encontrada.', 404, 'NOT_FOUND');
    }
    const publicId = imgRes.rows[0].cloudinary_public_id;

    await destroyCloudinaryAsset(publicId);
    await query('DELETE FROM imagenes_vivienda WHERE id = $1', [imgId]);

    return res.json({ ok: true, mensaje: 'Imagen eliminada correctamente.' });
  })
);

// DELETE /api/viviendas/:id (desactivar vivienda, propietario o admin)
router.delete(
  '/:id',
  requireAuth,
  validateParams(idParamSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.validatedParams;

    const vRes = await query('SELECT propietario_id FROM viviendas WHERE id = $1 LIMIT 1', [id]);
    if (!vRes.rows.length) {
      throw new AppError('Vivienda no encontrada.', 404, 'NOT_FOUND');
    }
    const vivienda = vRes.rows[0];
    if (vivienda.propietario_id !== req.usuario.id && req.usuario.rol !== 'admin') {
      throw new AppError('No autorizado.', 403, 'FORBIDDEN');
    }

    await query('UPDATE viviendas SET activo = FALSE, actualizado_en = now() WHERE id = $1', [id]);
    return res.json({ ok: true, mensaje: 'Vivienda desactivada correctamente.' });
  })
);

export default router;
