import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Toda la API de KRATOS vive en un solo backend (puerto 3000): /api/login, /api/ventas, /api/kr/…
      '/api': { target: 'http://localhost:3000', changeOrigin: true },
      // Servicio de WhatsApp (bandeja de conversaciones), con su websocket
      '/wa': { target: 'http://localhost:4010', changeOrigin: true, ws: true, rewrite: (path) => path.replace(/^\/wa/, '') },
    },
  },
})
