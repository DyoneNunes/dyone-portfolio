import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import legivelPorIa from './vite-plugin-legivel-ia.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), legivelPorIa()],
  server: {
    host: true, // dev server acessível por outros aparelhos da rede local
    // Só vale no dev server (produção serve o build estático): o Vite recusa
    // hosts que não estejam aqui (localhost e IPs são sempre aceitos).
    allowedHosts: ['dyonedev.com.br', 'www.dyonedev.com.br'],
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
