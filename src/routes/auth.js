/**
 * HABITABOGOTÁ — /src/routes/auth.js
 * Rutas de autenticación con JWT, bcrypt y cookies httpOnly.
 */

import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { validateBody, sanitizeText } from '../middleware/validate.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

const router = Router();

const registroSchema = z.object({
  nombre: z.preprocess((v) => sanitizeText(v), z.string().min(2, 'Ingresa tu nombre completo.').max(120)),
  correo: z.preprocess((v) => sanitizeText(v).toLowerCase(), z.string().email('Ingresa un correo electrónico válido.').max(255)),
  contrasena: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.').max(100),
  rol: z.enum(['comprador', 'arrendador']).optional().default('comprador')
});

const loginSchema = z.object({
  correo: z.preprocess((v) => sanitizeText(v).toLowerCase(), z.string().email('Ingresa un correo electrónico válido.').max(255)),
  contrasena: z.string().min(1, 'Ingresa tu contraseña.')
});

const perfilSchema = z.object({
  nombre: z.preprocess((v) => sanitizeText(v), z.string().min(2).max(120).optional()),
  avatar_url: z.string().url().optional().nullable()
});

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
};

function signUserToken(user) {
  const secret = process.env.JWT_SECRET || 'fallback_secret_key';
  return jwt.sign(
    { id: user.id, correo: user.correo, rol: user.rol, nombre: user.nombre },
    secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// POST /api/auth/registro
router.post(
  '/registro',
  validateBody(registroSchema),
  asyncHandler(async (req, res) => {
    const { nombre, correo, contrasena, rol } = req.validatedBody;

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
    const { correo, contrasena } = req.validatedBody;

    const result = await query('SELECT * FROM usuarios WHERE correo = $1 LIMIT 1', [correo]);
    if (!result.rows.length) {
      throw new AppError('Correo o contraseña incorrectos.', 401, 'INVALID_CREDENTIALS');
    }

    const usuario = result.rows[0];
    const match = await bcrypt.compare(contrasena, usuario.contrasena_hash);
    if (!match) {
      throw new AppError('Correo o contraseña incorrectos.', 401, 'INVALID_CREDENTIALS');
    }

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
  res.clearCookie('habi_token', { httpOnly: true, sameSite: 'strict' });
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
      throw new AppError('No hay datos para actualizar.', 400, 'NO_DATA');
    }

    fields.push(`actualizado_en = now()`);
    values.push(userId);

    const sql = `UPDATE usuarios SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id, nombre, correo, rol, avatar_url`;
    const result = await query(sql, values);
    const usuario = result.rows[0];

    // Renovar token con datos actualizados
    const token = signUserToken(usuario);
    res.cookie('habi_token', token, COOKIE_OPTIONS);

    return res.json({ ok: true, usuario });
  })
);

export default router;
