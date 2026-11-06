import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const dist = path.resolve(root, 'dist');

if (!fs.existsSync(dist)) {
  fs.mkdirSync(dist, { recursive: true });
}

// Copy js directory to dist/js
const jsSrc = path.resolve(root, 'js');
const jsDest = path.resolve(dist, 'js');
if (fs.existsSync(jsSrc)) {
  fs.cpSync(jsSrc, jsDest, { recursive: true });
  console.log('Copied /js to dist/js');
}

// Copy assets directory to dist/assets
const assetsSrc = path.resolve(root, 'assets');
const assetsDest = path.resolve(dist, 'assets');
if (fs.existsSync(assetsSrc)) {
  fs.cpSync(assetsSrc, assetsDest, { recursive: true });
  console.log('Copied /assets to dist/assets');
}

// Copy css directory to dist/css
const cssSrc = path.resolve(root, 'css');
const cssDest = path.resolve(dist, 'css');
if (fs.existsSync(cssSrc)) {
  fs.cpSync(cssSrc, cssDest, { recursive: true });
  console.log('Copied /css to dist/css');
}

console.log('✅ All static assets copied to dist successfully for Render production deployment.');
