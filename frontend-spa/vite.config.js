import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: true, // Permite conexiones externas al contenedor
    port: 5173,
    // Autorizamos el dominio de Cloudflare para evitar bloqueos
    allowedHosts: [
      'www.2026-a064.lat',
      'localhost'
    ]
  }
})