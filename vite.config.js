import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // necessário para expor o dev server dentro do container
    proxy: {
      // O formulário chama fetch('/api/contato') relativo — o Vite repassa:
      //   local : http://localhost:3002
      //   docker: http://backend:3002 (via BACKEND_URL no docker-compose)
      // (3002 porque a 3001 desta máquina pertence ao nirmind-api)
      '/api': {
        target: process.env.BACKEND_URL || 'http://localhost:3002',
        changeOrigin: true,
      },
    },
  },
})
