// Arquivo: frontend/vite.config.js (Com nomes dos ícones corrigidos)

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      devOptions: {
        enabled: true
      },
      manifest: {
        name: 'Hortifruti Frescor',
        short_name: 'Hortifruti',
        description: 'Seu app de delivery de hortifruti.',
        theme_color: '#4CAF50',
        background_color: '#ffffff',
        start_url: '/',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png', // << CORRIGIDO
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png', // << CORRIGIDO
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png', // << CORRIGIDO
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})