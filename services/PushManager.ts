export const triggerNativePush = async (title: string, body: string, urlPath: string = '/driver') => {
    // 1. Checa se o Safari/Chrome suporta
    if (!('serviceWorker' in navigator) || !('Notification' in window)) {
        console.warn('Push não suportado neste aparelho.');
        return;
    }

    try {
        // Pede permissão e avança só se ele aceitar
        const permission = await Notification.requestPermission();

        if (permission === 'granted') {
            const registration = await navigator.serviceWorker.ready;

            // Aqui montamos aquela notificação linda que cai no topo com seu logotipo (você já tem em /icons)
            registration.showNotification(title, {
                body,
                icon: '/icons/icon-192x192.png',
                badge: '/icons/icon-72x72.png',
                data: { url: urlPath }
            });
        }
    } catch (error) {
        console.error('Erro ao enviar Notificação Push:', error);
    }
};
