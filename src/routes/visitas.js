/**
 * HABITABOGOTÁ — /src/routes/visitas.js
 * Gestión de visitas inmobiliarias (requiere autenticación).
 */

import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody, validateParams } from '../middleware/validate.js';

const router = Router();

const visitaSchema = z.object({
  vivienda_id: z.coerce.number().int().positive(),
  fecha_preferida: z.string().min(1),
  horario: z.enum(['mañana', 'tarde', 'noche']),
  telefono: z.string().min(5).max(50),
  mensaje: z.string().max(500).optional().nullable()
});

const idParamSchema = z.object({
  id: z.coerce.number().int().positive()
});

// GET /api/visitas/mias
router.get(
  '/mias',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.usuario.id;
    const result = await query(
      `SELECT v.*, vi.titulo as vivienda_titulo, vi.barrio, vi.precio, vi.operacion, vi.tipo,
              (SELECT url FROM imagenes_vivienda iv WHERE iv.vivienda_id = vi.id ORDER BY iv.orden ASC LIMIT 1) as imagen_url
       FROM visitas v
       JOIN viviendas vi ON vi.id = v.vivienda_id
       WHERE v.usuario_id = $1
       ORDER BY v.creado_en DESC`,
      [userId]
    );
    return res.json({ ok: true, visitas: result.rows, data: { visitas: result.rows } });
  })
);

// POST /api/visitas
router.post(
  '/',
  requireAuth,
  validateBody(visitaSchema),
  asyncHandler(async (req, res) => {
    const userId = req.usuario.id;
    const { vivienda_id, fecha_preferida, horario, telefono, mensaje } = req.validatedBody;

    const vCheck = await query(
      'SELECT id, titulo, barrio, precio, COALESCE(administracion, 0) AS administracion FROM viviendas WHERE id = $1',
      [vivienda_id]
    );
    if (!vCheck.rows.length) {
      throw new AppError('La vivienda no existe.', 404, 'PROPERTY_NOT_FOUND');
    }

    const vivienda = vCheck.rows[0];
    const usuario = req.usuario;

    const result = await query(
      `INSERT INTO visitas (usuario_id, vivienda_id, fecha_preferida, horario, telefono, mensaje, estado)
       VALUES ($1, $2, $3, $4, $5, $6, 'pendiente')
       RETURNING *`,
      [userId, vivienda_id, fecha_preferida, horario, telefono, mensaje || '']
    );

    const nuevaVisita = result.rows[0];
    const costoTotal = Number(vivienda.precio || 0) + Number(vivienda.administracion || 0);

    const mensajeWA = encodeURIComponent(
`🏠 *Nueva visita agendada - HabitaBogotá*

👤 *Usuario:* ${usuario.nombre || 'Usuario'}
📧 *Correo:* ${usuario.correo || ''}
📱 *Teléfono:* ${telefono}

🏡 *Vivienda:* ${vivienda.titulo}
📍 *Barrio:* ${vivienda.barrio}
💰 *Costo total:* $${costoTotal.toLocaleString('es-CO')}/mes

📅 *Fecha preferida:* ${fecha_preferida}
🕐 *Horario:* ${horario}
💬 *Mensaje:* ${mensaje || 'Sin mensaje adicional'}

✅ Visita #${nuevaVisita.id} - Estado: Pendiente`
    );

    const urlWhatsApp = `https://wa.me/573186866186?text=${mensajeWA}`;

    return res.status(201).json({
      ok: true,
      visita: nuevaVisita,
      data: { visita: nuevaVisita, whatsapp_url: urlWhatsApp },
      mensaje: '¡Visita agendada exitosamente!'
    });
  })
);

// DELETE /api/visitas/:id
router.delete(
  '/:id',
  requireAuth,
  validateParams(idParamSchema),
  asyncHandler(async (req, res) => {
    const userId = req.usuario.id;
    const visitaId = req.validatedParams.id;

    await query('DELETE FROM visitas WHERE id = $1 AND usuario_id = $2', [visitaId, userId]);
    return res.json({ ok: true, mensaje: 'Visita eliminada' });
  })
);

// POST /api/visitas/:id/cancelar
router.post(
  '/:id/cancelar',
  requireAuth,
  validateParams(idParamSchema),
  asyncHandler(async (req, res) => {
    const userId = req.usuario.id;
    const visitaId = req.validatedParams.id;

    const result = await query(
      `UPDATE visitas SET estado = 'cancelada' WHERE id = $1 AND usuario_id = $2 RETURNING *`,
      [visitaId, userId]
    );

    if (!result.rows.length) {
      throw new AppError('Visita no encontrada o no autorizada.', 404, 'VISIT_NOT_FOUND');
    }

    return res.json({ ok: true, visita: result.rows[0] });
  })
);

export default router;
