// Arquivo: frontend/src/sw.js (Versão Completa e Corrigida)

import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'

// Limpa caches antigos de versões anteriores do PWA
cleanupOutdatedCaches()

// self.__WB_MANIFEST é o espaço reservado que será substituído pela lista de
// arquivos do seu app durante o processo de build.
// A função precacheAndRoute usa essa lista para salvar tudo em cache e fazer o app funcionar offline.
precacheAndRoute(self.__WB_MANIFEST)

// Este listener permite que o app se atualize para uma nova versão mais rapidamente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

// Nossa lógica customizada para receber as notificações push
self.addEventListener('push', (e) => {
  const data = e.data.json();
  console.log('Push Recebido no Service Worker:', data);
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: '/pwa-192x192.png' // O ícone que aparecerá na notificação
  });
});