/**
 * HABITABOGOTÁ — /src/middleware/rateLimit.js
 * Limitación de tasa por IP y por sesión para proteger la API y Groq.
 */

import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 250,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    error: 'Demasiadas solicitudes desde tu dirección. Intenta nuevamente en unos minutos.',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});

// Límite estricto para el chat IA: 20 solicitudes cada 10 minutos por IP + sesión
export const chatLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: (req) => {
    const ip = ipKeyGenerator(req);
    const sesion = req.get('X-Sesion-Id') || 'anon';
    return `${ip}:${sesion}`;
  },
  message: {
    error: 'Has alcanzado el límite de 20 mensajes al asistente cada 10 minutos. Espera un momento antes de intentar de nuevo.',
    code: 'CHAT_RATE_LIMIT'
  }
});

// Límite para formularios de alertas y soporte
export const formLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    error: 'Has enviado varias solicitudes seguidas. Por favor espera unos minutos.',
    code: 'FORM_RATE_LIMIT'
  }
});
