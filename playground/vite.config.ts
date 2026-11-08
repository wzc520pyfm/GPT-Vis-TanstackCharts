import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  server: {
    host: '0.0.0.0',
    port: 4318,
    strictPort: true,
    fs: {
      allow: ['..'],
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 4318,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
