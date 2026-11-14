/**
 * HABITABOGOTÁ — /src/routes/cloudinary.js
 * Endpoint para generar firma de Cloudinary para subida firmada desde el cliente.
 */

import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { generateCloudinarySignature } from '../services/cloudinary.js';

const router = Router();

// GET /api/cloudinary/firma
router.get(
  '/firma',
  requireAuth,
  asyncHandler(async (req, res) => {
    const folder = req.query.folder ? String(req.query.folder) : 'inmobiliaria/nuevas';
    const sigData = generateCloudinarySignature({ folder });
    return res.json({ ok: true, ...sigData });
  })
);

export default router;
