/**
 * HABITABOGOTÁ — /src/middleware/errorHandler.js
 * Manejo centralizado de errores sin exponer trazas ni detalles internos.
 */

export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
  }
}

export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function notFoundHandler(req, res, next) {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      error: 'Ruta de API no encontrada',
      code: 'NOT_FOUND'
    });
  }
  return next();
}

export function errorHandler(err, req, res, _next) {
  // Error de sintaxis JSON (cuerpo malformado o > 10kb)
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({
      error: 'La solicitud excede el tamaño máximo permitido (10 KB).',
      code: 'PAYLOAD_TOO_LARGE'
    });
  }

  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'El cuerpo JSON enviado no es válido.',
      code: 'INVALID_JSON'
    });
  }

  const statusCode = err?.statusCode && Number.isInteger(err.statusCode) ? err.statusCode : 500;
  const isOperational = Boolean(err?.isOperational);

  // Registro seguro sin datos sensibles ni variables de entorno
  console.error(`[Error ${statusCode}] ${req.method} ${req.originalUrl}: ${err?.code || 'ERR'} - ${isOperational ? err.message : 'Fallo interno controlado'}`);

  const clientMessage = isOperational
    ? err.message
    : 'Ocurrió un error interno en el servidor. Intenta de nuevo más tarde.';

  return res.status(statusCode).json({
    error: clientMessage,
    code: err?.code || 'INTERNAL_ERROR'
  });
}
