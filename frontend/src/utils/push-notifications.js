// Arquivo: frontend/src/utils/push-notifications.js

const API_BASE_URL = 'https://hortifruti-backend.onrender.com/api';

// Converte a chave pública VAPID de base64url para um formato que o navegador entende
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export async function subscribeUserToPush(token) {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Push messaging is not supported');
        return;
    }

    try {
        const registration = await navigator.serviceWorker.ready;
        let subscription = await registration.pushManager.getSubscription();

        if (subscription === null) {
            console.log('Não há inscrição, inscrevendo...');
            const response = await fetch(`${API_BASE_URL}/vapid-public-key`);
            const vapidPublicKey = await response.text();
            const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: convertedVapidKey
            });
        } else {
            console.log('Inscrição já existe.');
        }

        // Envia a inscrição para o backend
        await fetch(`${API_BASE_URL}/subscribe`, {
            method: 'POST',
            body: JSON.stringify({ subscription }),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        console.log('Inscrição enviada para o servidor.');
        alert('Notificações ativadas com sucesso!');

    } catch (error) {
        console.error('Falha ao se inscrever para notificações push: ', error);
        alert('Não foi possível ativar as notificações. Por favor, tente novamente.');
    }
}