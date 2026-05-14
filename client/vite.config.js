import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true
      },
      manifest: {
        name: 'Sistema Restaurante',
        short_name: 'Restaurante',
        description: 'Sistema de gestión para restaurante',
        theme_color: '#1e40af',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/icon.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: '/icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:4001',
        changeOrigin: true
      },
      '/socket.io': {
        target: 'http://localhost:4001',
        ws: true
      },
      '/demo': {
        target: 'http://localhost:4001',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:4001',
        changeOrigin: true
      }
    }
  }
})
