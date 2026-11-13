/**
 * HABITABOGOTÁ — /src/middleware/validate.js
 * Validación de entradas con Zod, saneamiento de texto y control de sesión UUID.
 */

import { z } from 'zod';
import { ensureSession } from '../db.js';
import { AppError } from './errorHandler.js';

const uuidSchema = z.string().uuid({ message: 'El identificador de sesión X-Sesion-Id debe ser un UUID válido.' });

// Elimina caracteres de control invisibles y recorta espacios extremos
export function sanitizeText(value) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim();
}

export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Datos de entrada inválidos.',
        code: 'VALIDATION_ERROR',
        detalles: result.error.issues.map((issue) => ({
          campo: issue.path.join('.') || 'cuerpo',
          mensaje: issue.message
        }))
      });
    }
    req.validatedBody = result.data;
    return next();
  };
}

export function validateQuery(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return res.status(400).json({
        error: 'Parámetros de consulta inválidos.',
        code: 'QUERY_VALIDATION_ERROR',
        detalles: result.error.issues.map((issue) => ({
          campo: issue.path.join('.') || 'query',
          mensaje: issue.message
        }))
      });
    }
    req.validatedQuery = result.data;
    return next();
  };
}

export function validateParams(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      return res.status(400).json({
        error: 'Parámetro de ruta inválido.',
        code: 'PARAM_VALIDATION_ERROR',
        detalles: result.error.issues.map((issue) => ({
          campo: issue.path.join('.') || 'param',
          mensaje: issue.message
        }))
      });
    }
    req.validatedParams = result.data;
    return next();
  };
}

export async function requireSessionId(req, res, next) {
  try {
    const rawHeader = req.get('X-Sesion-Id');
    const parsed = uuidSchema.safeParse(rawHeader);

    if (!parsed.success) {
      throw new AppError(
        'Cabecera X-Sesion-Id faltante o con formato UUID inválido.',
        400,
        'INVALID_SESSION_ID'
      );
    }

    req.sesionId = parsed.data;
    await ensureSession(req.sesionId);
    return next();
  } catch (err) {
    return next(err);
  }
}

export async function optionalSessionId(req, res, next) {
  try {
    const rawHeader = req.get('X-Sesion-Id');
    if (!rawHeader) {
      req.sesionId = null;
      return next();
    }
    const parsed = uuidSchema.safeParse(rawHeader);
    if (parsed.success) {
      req.sesionId = parsed.data;
      await ensureSession(req.sesionId);
    } else {
      req.sesionId = null;
    }
    return next();
  } catch (err) {
    return next(err);
  }
}
