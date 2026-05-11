import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
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
