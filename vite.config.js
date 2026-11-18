import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Dùng base tương đối để có thể deploy lên GitHub Pages / Firebase Hosting / Vercel
  base: './',
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        // Tách thư viện (ít thay đổi) khỏi code của app: mỗi lần cập nhật web người dùng
        // chỉ phải tải lại phần code app nhỏ, thư viện vẫn lấy từ cache trình duyệt.
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('@firebase/firestore') || id.includes('re2js')) return 'vendor-firestore';
          if (id.includes('firebase') || id.includes('@grpc') || id.includes('idb')) return 'vendor-firebase';
          if (id.includes('maplibre')) return; // đã nạp riêng khi cần
          if (id.includes('leaflet')) return 'vendor-leaflet';
          if (id.includes('react')) return 'vendor-react';
        },
      },
    },
  },
});
