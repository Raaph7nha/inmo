/**
 * HABITABOGOTÁ — /src/services/cloudinary.js
 * Generación de firmas firmadas para Cloudinary y destrucción de assets.
 */

import crypto from 'node:crypto';
import { query } from '../db.js';

export function generateCloudinarySignature({ folder = 'inmobiliaria/nuevas' }) {
  const timestamp = Math.round(Date.now() / 1000);
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

  if (!apiSecret || !apiKey || !cloudName) {
    throw new Error('Cloudinary no está configurado en las variables de entorno del servidor.');
  }

  // Parámetros a firmar ordenados alfabéticamente
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash('sha1').update(paramsToSign).digest('hex');

  return {
    signature,
    timestamp,
    cloud_name: cloudName,
    api_key: apiKey,
    folder
  };
}

export async function destroyCloudinaryAsset(publicId) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret || !publicId) return false;

  const timestamp = Math.round(Date.now() / 1000);
  const stringToSign = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash('sha1').update(stringToSign).digest('hex');

  try {
    const formData = new URLSearchParams();
    formData.append('public_id', publicId);
    formData.append('api_key', apiKey);
    formData.append('timestamp', String(timestamp));
    formData.append('signature', signature);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
      method: 'POST',
      body: formData
    });

    const data = await res.json();
    if (data.result !== 'ok' && data.result !== 'not found') {
      throw new Error(`Cloudinary destroy returned: ${data.result}`);
    }
    return true;
  } catch (err) {
    console.error('[Cloudinary] Error destruyendo asset, registrando como huérfana:', err.message);
    await query('INSERT INTO imagenes_huerfanas (cloudinary_public_id) VALUES ($1)', [publicId]).catch(() => {});
    return false;
  }
}
