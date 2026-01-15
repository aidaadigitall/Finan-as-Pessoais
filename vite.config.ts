import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Expose to network (crucial for VPS)
    port: 5173,
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
});