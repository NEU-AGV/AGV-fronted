import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  server: {
    proxy: {
      // 代理所有以 /api 开头的请求
      '/api': {
        // 代理目标，这里假设您的 Spring Boot 后端运行在 8080 端口
        target: 'http://localhost:8080',
        // 允许跨域
        changeOrigin: true,
        // 重写路径，去掉 /api 前缀
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
