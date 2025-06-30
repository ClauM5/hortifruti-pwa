// Arquivo: frontend/public/sw.js

console.log('Service Worker Carregado.');

self.addEventListener('push', e => {
    const data = e.data.json();
    console.log('Push Recebido...', data);
    self.registration.showNotification(data.title, {
        body: data.body,
        icon: '/icon-192x192.png' // Ícone que aparecerá na notificação
    });
});