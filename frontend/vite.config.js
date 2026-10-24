import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:3100', rewrite: (path) => path.replace(/^\/api/, '') },
      '/contact': { target: 'http://localhost:3100' },
      '/messages': { target: 'http://localhost:3100' },
    },
  },
});
