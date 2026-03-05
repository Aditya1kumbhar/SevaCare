// Example: Add this to your login component after successful login

import { fcmService } from '@/lib/services/fcmService';

async function onLoginSuccess(userId: string) {
  // ... existing login logic ...

  // Request notification permission
  console.log('📱 Requesting notification permission...');
  const deviceToken = await fcmService.requestPermissionAndGetToken();

  if (deviceToken) {
    // Save token to backend
    await fcmService.saveTokenToBackend(deviceToken, userId);

    // Listen for messages
    fcmService.listenForMessages((payload) => {
      console.log('📬 Got a message:', payload);
      // Handle custom logic here
    });
  } else {
    console.warn('⚠️ Notifications disabled - user denied permission');
  }
}
