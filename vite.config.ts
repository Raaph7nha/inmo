import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

const appDir = typeof import.meta.dirname !== 'undefined' ? import.meta.dirname : path.resolve('.');

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(appDir, '.'),
      },
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(appDir, 'index.html'),
          inmueble: path.resolve(appDir, 'inmueble.html'),
          guardados: path.resolve(appDir, 'guardados.html'),
          comparador: path.resolve(appDir, 'comparador.html'),
          ayuda: path.resolve(appDir, 'ayuda.html'),
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
