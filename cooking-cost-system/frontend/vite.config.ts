import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    // DNS リバインディング攻撃を防ぐため localhost のみ許可
    // トンネル経由でアクセスする場合は issue #134 を参照
    allowedHosts: ['localhost', '127.0.0.1'],
    /* 
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
    */
  },
})