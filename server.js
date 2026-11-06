import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Determine static root: dist in production, fallback to root if dist not built yet
const distPath = path.resolve(__dirname, 'dist');
const staticRoot = fs.existsSync(distPath) ? distPath : __dirname;

console.log(`[HabitaBogotá] Sirviendo archivos desde: ${staticRoot}`);

// Serve static assets with standard caching headers
app.use(express.static(staticRoot, {
  extensions: ['html'],
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : '0'
}));

// Explicit friendly routes mapping
const routes = [
  { path: '/', file: 'index.html' },
  { path: '/inmueble', file: 'inmueble.html' },
  { path: '/guardados', file: 'guardados.html' },
  { path: '/comparador', file: 'comparador.html' },
  { path: '/ayuda', file: 'ayuda.html' }
];

routes.forEach(({ path: routePath, file }) => {
  app.get(routePath, (req, res) => {
    const filePath = path.join(staticRoot, file);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.sendFile(path.join(__dirname, file));
    }
  });
});

// Health check endpoint for Render / monitoring
app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// Fallback to index.html
app.use((req, res) => {
  const indexFile = path.join(staticRoot, 'index.html');
  if (fs.existsSync(indexFile)) {
    res.sendFile(indexFile);
  } else {
    res.status(404).send('Página no encontrada');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 HabitaBogotá activo en http://0.0.0.0:${PORT}`);
  console.log(`🌍 Listo para producción en Render`);
});
