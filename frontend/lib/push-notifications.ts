'use client';

/**
 * Push Notification helpers (100% free — uses browser Notification API)
 */

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

export async function showLocalNotification(
  title: string,
  body: string,
  tag?: string
) {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;

  // Try Service Worker notification first (works in background)
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        body,
        icon: '/icon-light-32x32.png',
        badge: '/icon-light-32x32.png',
        tag: tag || 'sevacare-emergency',
        requireInteraction: true,
        vibrate: [200, 100, 200, 100, 200],
      } as any);
      return;
    } catch (e) {
      console.warn('SW notification failed, falling back:', e);
    }
  }

  // Fallback to basic Notification API
  new Notification(title, {
    body,
    icon: '/icon-light-32x32.png',
    tag: tag || 'sevacare-emergency',
    requireInteraction: true,
  });
}
