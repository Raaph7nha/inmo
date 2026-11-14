/**
 * HABITABOGOTÁ — /src/middleware/auth.js
 * Middleware de autenticación JWT (cookie httpOnly) y verificación de roles.
 */

import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler.js';

export function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.habi_token || req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      throw new AppError('Inicia sesión para realizar esta acción.', 401, 'UNAUTHORIZED');
    }

    const secret = process.env.JWT_SECRET || 'fallback_secret_key';
    const decoded = jwt.verify(token, secret);
    req.usuario = decoded; // { id, correo, rol, nombre }
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') {
      return next(new AppError('Sesión caducada o inválida. Vuelve a iniciar sesión.', 401, 'INVALID_TOKEN'));
    }
    return next(err);
  }
}

export function optionalAuth(req, _res, next) {
  try {
    const token = req.cookies?.habi_token || req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      const secret = process.env.JWT_SECRET || 'fallback_secret_key';
      const decoded = jwt.verify(token, secret);
      req.usuario = decoded;
    }
  } catch {
    req.usuario = null;
  }
  return next();
}

export function requireRole(allowedRoles = []) {
  return (req, _res, next) => {
    if (!req.usuario) {
      return next(new AppError('No autenticado.', 401, 'UNAUTHORIZED'));
    }

    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    if (req.usuario.rol !== 'admin' && !roles.includes(req.usuario.rol)) {
      return next(new AppError('No tienes permisos suficientes para realizar esta acción.', 403, 'FORBIDDEN'));
    }

    return next();
  };
}
