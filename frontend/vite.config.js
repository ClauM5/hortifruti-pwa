// Arquivo: frontend/vite.config.js

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Configuração para o nosso service worker personalizado
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js', // Nome do nosso service worker
      devOptions: {
        enabled: true // Habilita o SW em modo de desenvolvimento
      },
      manifest: {
        // ... (seu manifesto PWA existente)
        name: 'Hortifruti Frescor',
        short_name: 'Hortifruti',
        description: 'Seu app de delivery de hortifruti.',
        theme_color: '#4CAF50',
        icons: [
          {
            src: 'icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})