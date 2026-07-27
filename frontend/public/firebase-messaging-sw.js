// Firebase Cloud Messaging service worker
// Gracefully disabled – will only initialize if valid Firebase config is provided.
// To enable: replace placeholder values in your .env.local and rebuild.

try {
  importScripts('https://www.gstatic.com/firebasejs/9.10.0/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/9.10.0/firebase-messaging-compat.js');

  const firebaseConfig = {
    apiKey: self.__FIREBASE_CONFIG__?.apiKey || '',
    authDomain: self.__FIREBASE_CONFIG__?.authDomain || '',
    projectId: self.__FIREBASE_CONFIG__?.projectId || '',
    storageBucket: self.__FIREBASE_CONFIG__?.storageBucket || '',
    messagingSenderId: self.__FIREBASE_CONFIG__?.messagingSenderId || '',
    appId: self.__FIREBASE_CONFIG__?.appId || '',
  };

  // Only initialize if config values are present
  if (firebaseConfig.apiKey && firebaseConfig.apiKey !== 'YOUR_API_KEY') {
    firebase.initializeApp(firebaseConfig);
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
      console.log('[firebase-messaging-sw.js] Received background message', payload);
      const notificationTitle = payload.notification?.title || 'SevaCare Alert';
      const notificationOptions = {
        body: payload.notification?.body || '',
        icon: '/logo.png',
        tag: 'notification',
        requireInteraction: true,
        data: payload.data,
      };
      self.registration.showNotification(notificationTitle, notificationOptions);
    });
  } else {
    console.log('[firebase-messaging-sw.js] Firebase config not provided – FCM disabled.');
  }
} catch (err) {
  console.log('[firebase-messaging-sw.js] Firebase not available – skipping.', err);
}

// Handle notification click (works regardless of Firebase)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/dashboard');
    }),
  );
});
