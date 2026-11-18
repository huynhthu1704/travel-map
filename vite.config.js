import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Dùng base tương đối để có thể deploy lên GitHub Pages / Firebase Hosting / Vercel
  base: './',
  build: {
    chunkSizeWarningLimit: 1500,
  },
});
