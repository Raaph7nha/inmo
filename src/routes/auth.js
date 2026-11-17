/**
 * HABITABOGOTÁ — /src/routes/auth.js
 * Rutas de autenticación con JWT, bcrypt, cookies httpOnly y migración de sesión anónima.
 */

import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { isDatabaseConfigured, query } from '../db.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { validateBody, sanitizeText } from '../middleware/validate.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

const router = Router();

const registroSchema = z.object({
  nombre: z.preprocess((v) => sanitizeText(v), z.string().min(2, 'Ingresa tu nombre completo.').max(120)),
  correo: z.preprocess((v) => sanitizeText(v).toLowerCase(), z.string().email('Ingresa un correo electrónico válido.').max(255)),
  contrasena: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.').max(100),
  rol: z.enum(['comprador', 'arrendador']).optional().default('comprador'),
  session_id: z.string().optional().nullable()
});

const loginSchema = z.object({
  correo: z.preprocess((v) => sanitizeText(v).toLowerCase(), z.string().email('Ingresa un correo electrónico válido.').max(255)),
  contrasena: z.string().min(1, 'Ingresa tu contraseña.'),
  session_id: z.string().optional().nullable()
});

const perfilSchema = z.object({
  nombre: z.preprocess((v) => sanitizeText(v), z.string().min(2).max(120).optional()),
  avatar_url: z.string().url().optional().nullable()
});

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000
};

function signUserToken(user) {
  const secret = process.env.JWT_SECRET || 'fallback_secret_key';
  return jwt.sign(
    { id: user.id, correo: user.correo, rol: user.rol, nombre: user.nombre },
    secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

async function migrateSessionData(userId, sesionId) {
  if (!sesionId || !isDatabaseConfigured()) return;
  try {
    await query(`
      INSERT INTO guardados (usuario_id, vivienda_id)
      SELECT $1, vivienda_id FROM guardados WHERE sesion_id = $2 AND usuario_id IS NULL
      ON CONFLICT DO NOTHING
    `, [userId, sesionId]);
    await query('DELETE FROM guardados WHERE sesion_id = $2 AND usuario_id IS NULL', [userId, sesionId]);

    await query(`
      INSERT INTO comparador (usuario_id, vivienda_id)
      SELECT $1, vivienda_id FROM comparador WHERE sesion_id = $2 AND usuario_id IS NULL
      ON CONFLICT DO NOTHING
    `, [userId, sesionId]);
    await query('DELETE FROM comparador WHERE sesion_id = $2 AND usuario_id IS NULL', [userId, sesionId]);
  } catch (err) {
    console.warn('Error migrando datos anónimos:', err);
  }
}

// POST /api/auth/registro
router.post(
  '/registro',
  validateBody(registroSchema),
  asyncHandler(async (req, res) => {
    const { nombre, correo, contrasena, rol, session_id } = req.validatedBody;

    const existing = await query('SELECT id FROM usuarios WHERE correo = $1', [correo]);
    if (existing.rows.length > 0) {
      throw new AppError('Ya existe una cuenta registrada con este correo electrónico.', 409, 'EMAIL_EXISTS');
    }

    const contrasena_hash = await bcrypt.hash(contrasena, 12);
    const result = await query(
      'INSERT INTO usuarios (nombre, correo, contrasena_hash, rol, verificado) VALUES ($1, $2, $3, $4, true) RETURNING id, nombre, correo, rol, avatar_url, creado_en',
      [nombre, correo, contrasena_hash, rol]
    );

    const usuario = result.rows[0];
    await migrateSessionData(usuario.id, session_id);

    const token = signUserToken(usuario);

    res.cookie('habi_token', token, COOKIE_OPTIONS);
    return res.status(201).json({
      ok: true,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol,
        avatar_url: usuario.avatar_url
      }
    });
  })
);

// POST /api/auth/login
router.post(
  '/login',
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const { correo, contrasena, session_id } = req.validatedBody;

    const result = await query('SELECT * FROM usuarios WHERE correo = $1 LIMIT 1', [correo]);
    if (!result.rows.length) {
      throw new AppError('Correo o contraseña incorrectos.', 401, 'INVALID_CREDENTIALS');
    }

    const usuario = result.rows[0];
    const match = await bcrypt.compare(contrasena, usuario.contrasena_hash);
    if (!match) {
      throw new AppError('Correo o contraseña incorrectos.', 401, 'INVALID_CREDENTIALS');
    }

    await migrateSessionData(usuario.id, session_id);

    const token = signUserToken(usuario);

    res.cookie('habi_token', token, COOKIE_OPTIONS);
    return res.json({
      ok: true,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol,
        avatar_url: usuario.avatar_url
      }
    });
  })
);

// POST /api/auth/logout
router.post('/logout', (_req, res) => {
  res.clearCookie('habi_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/'
  });
  return res.json({ ok: true, mensaje: 'Sesión cerrada correctamente.' });
});

// GET /api/auth/yo
router.get(
  '/yo',
  optionalAuth,
  asyncHandler(async (req, res) => {
    if (!req.usuario) {
      return res.json({ ok: true, usuario: null });
    }
    const result = await query(
      'SELECT id, nombre, correo, rol, avatar_url, verificado, creado_en FROM usuarios WHERE id = $1 LIMIT 1',
      [req.usuario.id]
    );
    if (!result.rows.length) {
      return res.json({ ok: true, usuario: null });
    }
    return res.json({ ok: true, usuario: result.rows[0] });
  })
);

// PUT /api/auth/perfil
router.put(
  '/perfil',
  requireAuth,
  validateBody(perfilSchema),
  asyncHandler(async (req, res) => {
    const { nombre, avatar_url } = req.validatedBody;
    const userId = req.usuario.id;

    const fields = [];
    const values = [];
    let idx = 1;

    if (nombre !== undefined) {
      fields.push(`nombre = $${idx++}`);
      values.push(nombre);
    }
    if (avatar_url !== undefined) {
      fields.push(`avatar_url = $${idx++}`);
      values.push(avatar_url);
    }

    if (fields.length === 0) {
      return res.json({ ok: true, mensaje: 'Sin cambios.' });
    }

    fields.push(`actualizado_en = now()`);
    values.push(userId);

    const result = await query(
      `UPDATE usuarios SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id, nombre, correo, rol, avatar_url, creado_en`,
      values
    );

    return res.json({ ok: true, usuario: result.rows[0] });
  })
);

export default router;
