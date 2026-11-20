import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('.', import.meta.url)),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        // Redirigir las solicitudes de la API al backend.
        // Excluir axios.ts porque es código fuente del frontend.
        '^/api/(?!axios\\.ts(?:$|\\?))': {
          // Dirección del servidor Express.
          target: 'http://localhost:5000',

          // Ajustar el origen de las solicitudes al destino.
          changeOrigin: true,
        },
      },
    },
  };
});
