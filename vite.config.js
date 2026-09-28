import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Forward API calls made by the frontend (fetch('/api/ask-astro'), etc.)
      // to the Express backend during local development.
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true
      }
    }
  }
});
