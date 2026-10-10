import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({
  publicDir: 'src/mock/fixtures',
  plugins: [react(), tailwindcss()],
  test: { environment: 'node', include: ['tests/**/*.test.js'] },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          charts: ['recharts'],
          forms: ['react-hook-form', 'zod', '@hookform/resolvers'],
          qr: ['qrcode'],
        },
      },
    },
  },
});
