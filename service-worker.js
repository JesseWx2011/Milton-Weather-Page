self.addEventListener('install', (event) => {
    console.log('Service Worker installed');
});

self.addEventListener('activate', (event) => {
    console.log('Service Worker activated');
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    // If there's a URL in the notification data, open it
    if (event.notification.data && event.notification.data.url) {
        event.waitUntil(
            clients.openWindow(event.notification.data.url)
        );
    } else {
        // Otherwise, focus the main window
        event.waitUntil(
            clients.matchAll({ type: 'window' }).then((clientList) => {
                if (clientList.length > 0) {
                    let client = clientList[0];
                    for (let i = 0; i < clientList.length; i++) {
                        if (clientList[i].focused) {
                            client = clientList[i];
                        }
                    }
                    return client.focus();
                }
                return clients.openWindow('/');
            })
        );
    }
});

self.addEventListener('push', (event) => {
    const options = {
        body: event.data.text(),
        icon: '/Favicon.png',
        badge: '/Favicon.png',
        vibrate: [100, 50, 100],
        requireInteraction: true,
        silent: false
    };

    event.waitUntil(
        self.registration.showNotification('Weather Alert', options)
    );
}); 