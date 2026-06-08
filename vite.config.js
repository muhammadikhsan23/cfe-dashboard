import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: '/cfe-dashboard/',
  plugins: [vue()],
  server: {
    port: 7890,
    strictPort: true
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})