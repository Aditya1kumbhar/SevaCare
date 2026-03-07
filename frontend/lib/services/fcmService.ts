import { messaging, getToken, onMessage } from '@/lib/firebase';
import { toast } from 'sonner';

export const fcmService = {
  /**
   * Request notification permission and get device token
   */
  async requestPermissionAndGetToken(): Promise<string | null> {
    try {
      // Check if browser supports notifications
      if (!('Notification' in window)) {
        console.warn('⚠️ This browser does not support notifications');
        return null;
      }

      // Check current permission
      if (Notification.permission === 'granted') {
        console.log('✅ Notification permission already granted');
        return this.getDeviceToken();
      }

      // Request permission
      if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          console.log('✅ Notification permission granted');
          return this.getDeviceToken();
        }
      }

      console.warn('⚠️ Notification permission denied');
      return null;
    } catch (error) {
      console.error('❌ Error requesting notification permission:', error);
      return null;
    }
  },

  /**
   * Get device token from Firebase
   */
  async getDeviceToken(): Promise<string | null> {
    try {
      if (!messaging) {
        console.warn('⚠️ Firebase Messaging not initialized');
        return null;
      }

      // Get VAPID key from environment
      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

      const token = await getToken(messaging, {
        vapidKey,
      });

      if (token) {
        console.log('📱 Device token:', token);
        // Save token to localStorage for later use
        localStorage.setItem('fcm_token', token);
        return token;
      } else {
        console.warn('⚠️ No registration token available. Request permission first.');
        return null;
      }
    } catch (error) {
      console.error('❌ Error getting device token:', error);
      return null;
    }
  },

  /**
   * Get saved token from localStorage
   */
  getSavedToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('fcm_token');
    }
    return null;
  },

  /**
   * Listen for foreground messages
   */
  listenForMessages(
    onMessageCallback?: (payload: any) => void,
  ): (() => void) | null {
    try {
      if (!messaging) {
        console.warn('⚠️ Firebase Messaging not initialized');
        return null;
      }

      const unsubscribe = onMessage(messaging, (payload) => {
        console.log('📬 Foreground message received:', payload);

        // Show toast notification
        if (payload.notification) {
          toast.success(payload.notification.title, {
            description: payload.notification.body,
          });
        }

        // Call custom callback
        if (onMessageCallback) {
          onMessageCallback(payload);
        }
      });

      return unsubscribe;
    } catch (error) {
      console.error('❌ Error listening for messages:', error);
      return null;
    }
  },

  /**
   * Send device token to backend for saving
   */
  async saveTokenToBackend(deviceToken: string, userId: string): Promise<boolean> {
    try {
      const response = await fetch('/api/v1/users/device-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          deviceToken,
          userId,
        }),
      });

      if (response.ok) {
        console.log('✅ Device token saved to backend');
        return true;
      } else {
        console.warn('⚠️ Failed to save token to backend');
        return false;
      }
    } catch (error) {
      console.error('❌ Error saving token to backend:', error);
      return false;
    }
  },

  /**
   * Clear stored token (on logout)
   */
  clearToken(): void {
    localStorage.removeItem('fcm_token');
    console.log('🗑️ FCM token cleared');
  },
};
