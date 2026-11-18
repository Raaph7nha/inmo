/**
 * HABITABOGOTÁ — /server.js
 * Servidor Express unificado: API REST (/api/*), chat IA con Groq y archivos estáticos (/public).
 */

import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import helmet from 'helmet';
import cors from 'cors';

import cookieParser from 'cookie-parser';

import { checkDbHealth, query } from './src/db.js';
import { getBarriosResumen } from './src/services/viviendasQuery.js';
import { apiLimiter } from './src/middleware/rateLimit.js';
import { notFoundHandler, errorHandler } from './src/middleware/errorHandler.js';

import authRouter from './src/routes/auth.js';
import cloudinaryRouter from './src/routes/cloudinary.js';
import viviendasRouter from './src/routes/viviendas.js';
import guardadosRouter from './src/routes/guardados.js';
import comparadorRouter from './src/routes/comparador.js';
import alertasRouter from './src/routes/alertas.js';
import soporteRouter from './src/routes/soporte.js';
import chatRouter from './src/routes/chat.js';
import visitasRouter from './src/routes/visitas.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, 'public');

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Confía en el primer proxy (Render, Vercel, Cloud Run) para rate limit por IP real
app.set('trust proxy', 1);

// Cookie parser para JWT en cookies httpOnly
app.use(cookieParser());

// Seguridad HTTP con Helmet y CSP compatible con Google Fonts, Unsplash, Cloudinary, Leaflet y OSM
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://unpkg.com'],
        scriptSrcAttr: ["'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://unpkg.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https://images.unsplash.com', 'https://res.cloudinary.com', 'https://*.tile.openstreetmap.org', 'https://*.openstreetmap.org', 'https://unpkg.com'],
        connectSrc: ["'self'", 'https://api.cloudinary.com'],
        objectSrc: ["'none'"],
        frameAncestors: ["'self'", 'https://*.google.com', 'https://aistudio.google.com'],
        upgradeInsecureRequests: null
      }
    },
    crossOriginEmbedderPolicy: false
  })
);

// CORS restringido a orígenes configurados
const allowedOrigins = new Set(
  [
    ...(process.env.ALLOWED_ORIGIN || '').split(',').map((s) => s.trim()),
    process.env.APP_URL,
    `http://localhost:${PORT}`,
    'http://127.0.0.1:3000'
  ].filter(Boolean)
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Permitir solicitudes del mismo origen o herramientas locales sin cabecera Origin
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Sesion-Id'],
    credentials: true
  })
);

// Límite estricto de cuerpo JSON (10 KB)
app.use(express.json({ limit: '10kb' }));

// Limitador general para rutas API
app.use('/api', apiLimiter);

// Endpoint de salud para verificar conexión a Neon Postgres o modo memoria preview
app.get('/api/salud', async (_req, res) => {
  const db = await checkDbHealth();
  const statusCode = db.ok ? 200 : 503;
  return res.status(statusCode).json({
    ok: db.ok,
    servicio: 'habitabogota-api',
    base_datos: db.ok
      ? (db.mode === 'memory' ? 'memoria_preview' : 'conectada')
      : 'no_disponible',
    marca_tiempo: new Date().toISOString()
  });
});

// Alias de healthcheck para Render
app.get('/healthz', (_req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// Endpoint temporal de diagnóstico
app.get('/api/diagnostico', async (_req, res) => {
  try {
    const db = await checkDbHealth();
    if (!db.ok || db.mode === 'memory') {
      return res.json({
        ok: true,
        modo: 'memoria',
        tablas: ['viviendas', 'usuarios', 'puntos_interes'],
        conteo_viviendas: 20,
        conteo_inmuebles: 0,
        primera_vivienda: null
      });
    }
    const tablas = await query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
    const conteoV = await query("SELECT COUNT(*) FROM viviendas");
    const primeraV = await query("SELECT id, titulo, operacion FROM viviendas LIMIT 1");
    return res.json({
      ok: true,
      tablas: tablas.rows,
      conteo_viviendas: Number(conteoV.rows[0]?.count || 0),
      conteo_inmuebles: 0,
      primera_vivienda: primeraV.rows[0] || null
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// Rutas REST de la plataforma
app.get('/api/localidades', async (_req, res, next) => {
  try {
    const rows = await getBarriosResumen();
    return res.json({ ok: true, data: rows });
  } catch (err) {
    return next(err);
  }
});
app.use('/api/auth', authRouter);
app.use('/api/cloudinary', cloudinaryRouter);
app.use('/api/viviendas', viviendasRouter);
app.use('/api/inmuebles', viviendasRouter);
app.use('/api/guardados', guardadosRouter);
app.use('/api/comparador', comparadorRouter);
app.use('/api/alertas', alertasRouter);
app.use('/api/soporte', soporteRouter);
app.use('/api/chat', chatRouter);
app.use('/api/visitas', visitasRouter);

// Manejo de rutas API inexistentes
app.use(notFoundHandler);

// Servir frontend estático desde /public sin caché en HTML, JS ni CSS
app.use(
  express.static(publicDir, {
    extensions: ['html'],
    etag: false,
    lastModified: false,
    maxAge: 0,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html') || filePath.endsWith('.js') || filePath.endsWith('.css')) {
        res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
      }
    }
  })
);

// Rutas amigables a las páginas HTML del frontend
const pageRoutes = [
  { route: '/', file: 'index.html' },
  { route: '/inmueble', file: 'inmueble.html' },
  { route: '/guardados', file: 'guardados.html' },
  { route: '/comparador', file: 'comparador.html' },
  { route: '/ayuda', file: 'ayuda.html' },
  { route: '/perfil', file: 'perfil.html' }
];

pageRoutes.forEach(({ route, file }) => {
  app.get(route, (_req, res) => {
    const filePath = path.join(publicDir, file);
    if (fs.existsSync(filePath)) {
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      return res.sendFile(filePath, { etag: false, lastModified: false });
    }
    return res.status(404).send('Página no encontrada');
  });
});

// Fallback para rutas web desconocidas
app.use((_req, res) => {
  const indexFile = path.join(publicDir, 'index.html');
  if (fs.existsSync(indexFile)) {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    return res.sendFile(indexFile, { etag: false, lastModified: false });
  }
  return res.status(404).send('Recurso no encontrado');
});

// Middleware centralizado de errores (siempre al final)
app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`HabitaBogotá servidor activo en http://0.0.0.0:${PORT}`);
});
