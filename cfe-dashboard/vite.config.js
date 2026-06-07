import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: '/cfe-dashboard/',
  plugins: [vue()],
  server: {
    port: 5173,
    strictPort: true
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})