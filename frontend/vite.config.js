import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Proxy vers l'API Gateway pendant le développement
    // (évite les problèmes CORS côté navigateur si la Gateway CORS n'est pas encore configurée)
    proxy: {
      '/api': {
        target: 'http://localhost:8085',
        changeOrigin: true,
        rewrite: (path) => path, // conserve /api/...
      },
    },
  },
});
