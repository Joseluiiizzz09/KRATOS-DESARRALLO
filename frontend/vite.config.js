import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // El Backoffice.jsx copiado tal cual de KRONO pide rutas relativas "/api"
      // (en KRONO, un proxy del mismo dominio las lleva al backend). Aquí las
      // reenvía al backend real de KRONO que corre en local (puerto 3000).
      '/api': { target: 'http://localhost:3000', changeOrigin: true },
    },
  },
})
