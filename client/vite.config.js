import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // 127.0.0.1 thay vì localhost: tránh lỗi IPv6 (::1) trên một số máy Windows/macOS
  const target = env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:3000';

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: { '/api': { target, changeOrigin: true } },
      // Cho phép mock adapter import matchingService từ ../server (cùng monorepo)
      fs: { allow: ['..'] },
    },
    preview: { proxy: { '/api': { target, changeOrigin: true } } },
  };
});
