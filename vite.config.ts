import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // When running in Docker, VITE_API_TARGET is set to http://backend:8080
    // When running locally, it falls back to http://localhost:8080
    host: '0.0.0.0',  // needed for Docker container to expose the port
    proxy: {
      '/api': {
        target: process.env.VITE_API_TARGET || 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
