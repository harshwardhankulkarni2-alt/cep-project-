import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://cep-project-4iqd.onrender.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
});