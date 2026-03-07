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
    host: true, // Permite conexiones externas al contenedor [cite: 2026-03-05]
    port: 5173,
    // Autorizamos tu dominio de Cloudflare para evitar el bloqueo [cite: 2026-03-03]
    allowedHosts: [
      'www.2026-a064.lat',
      'localhost'
    ]
  }
})