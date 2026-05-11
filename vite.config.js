import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  plugins: [react(), basicSsl()],
  server: {
    host: true,           // expose to LAN so phone can connect
    https: true,          // self-signed cert → secure context for navigator.share
    port: 5173,
    strictPort: false,
    proxy: {
      '/img-proxy/tmdb': {
        target: 'https://image.tmdb.org',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/img-proxy\/tmdb/, ''),
      },
      '/img-proxy/directus': {
        target: 'http://localhost:8055',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/img-proxy\/directus/, ''),
      },
    },
  },
})
