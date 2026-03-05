# Firebase Cloud Messaging (FCM) Testing Guide

## Overview
Your SevaCare application now has complete Firebase Cloud Messaging integration for push notifications. This guide will help you test the implementation end-to-end.

## Current Status
✅ **Backend**: Running on http://localhost:3001
- All notification endpoints registered and secured with JWT
- Firebase Admin SDK properly configured with environment variables
- Endpoints:
  - `POST /api/v1/notifications/send-to-device`
  - `POST /api/v1/notifications/send-medication-reminder`
  - `POST /api/v1/notifications/send-health-alert`
  - `POST /api/v1/notifications/send-appointment-reminder`

✅ **Frontend**: Running on http://localhost:3000
- Firebase SDK configured with Web credentials
- FCM service implemented (`lib/services/fcmService.ts`)
- Service Worker for background notifications ready

---

## Testing Steps

### Step 1: Browser Console Setup
1. Open http://localhost:3000 in your browser
2. Open Developer Tools (F12)
3. Go to the Console tab to monitor messages

### Step 2: Register Service Worker
The Service Worker should auto-register when the app loads. In the Console, you should see:
```
✅ Service Worker registered: [registration object]
```

If you don't see this message, check for errors about `firebase-messaging-sw.js`.

### Step 3: Request Notification Permission
1. The app should prompt for notification permission in the browser
2. Accept the permission when prompted
3. In Console, you should see:
```
📱 Requesting notification permission...
✅ Token retrieved: [device-token]
```

**Note**: If you reject permissions, notifications won't work in that browser.

### Step 4: Save Device Token to Backend
After accepting permissions, the token should be automatically saved to the backend. Check the Console for:
```
🔐 Saving token to backend...
✅ Token saved to backend successfully!
```

### Step 5: Test Sending a Notification via API

#### Option A: Using Postman (Recommended)
1. Get a valid JWT token by logging in to the app
2. In Postman, create a POST request to: `http://localhost:3001/api/v1/notifications/send-medication-reminder`
3. Set headers:
   ```
   Authorization: Bearer [your-jwt-token]
   Content-Type: application/json
   ```
4. Use this request body (replace device token with actual token from browser console):
   ```json
   {
     "deviceTokens": ["[device-token-from-console]"],
     "residentName": "John Doe",
     "medicationName": "Aspirin",
     "dose": "100mg"
   }
   ```
5. Send the request
6. You should receive a 200 response with:
   ```json
   {
     "successCount": 1,
     "failureCount": 0,
     "responses": [...]
   }
   ```

#### Option B: Using curl
```bash
curl -X POST http://localhost:3001/api/v1/notifications/send-medication-reminder \
  -H "Authorization: Bearer [jwt-token]" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceTokens": ["[device-token]"],
    "residentName": "John Doe",
    "medicationName": "Aspirin",
    "dose": "100mg"
  }'
```

### Step 6: Verify Notification Received

#### If App is in Foreground
- The notification will appear as a console message:
  ```
  📬 Got a message: {
    notification: { title: '💊 Medication Reminder', body: '...' },
    data: {...}
  }
  ```

#### If App is in Background
1. Close or minimize the browser window
2. The notification will appear as a browser notification (native OS notification)
3. Click on the notification to bring the app to foreground

---

## Available Notification Types

### 1. Medication Reminder
**Endpoint**: `POST /api/v1/notifications/send-medication-reminder`
```json
{
  "deviceTokens": ["token1", "token2"],
  "residentName": "John Doe",
  "medicationName": "Aspirin",
  "dose": "100mg"
}
```
**Notification**: 💊 Medication Reminder - "John Doe needs to take Aspirin (100mg)"

### 2. Health Alert
**Endpoint**: `POST /api/v1/notifications/send-health-alert`
```json
{
  "deviceTokens": ["token1"],
  "residentName": "Jane Doe",
  "alertType": "Blood Pressure",
  "message": "Elevated reading detected"
}
```
**Notification**: 🚨 Health Alert - "Jane Doe: Elevated reading detected"

### 3. Appointment Reminder
**Endpoint**: `POST /api/v1/notifications/send-appointment-reminder`
```json
{
  "deviceTokens": ["token1"],
  "residentName": "Bob Smith",
  "appointmentType": "Doctor's Visit",
  "time": "2:00 PM"
}
```
**Notification**: 📅 Appointment Reminder - "Bob Smith has Doctor's Visit at 2:00 PM"

### 4. Generic Notification
**Endpoint**: `POST /api/v1/notifications/send-to-device`
```json
{
  "deviceToken": "single-token",
  "title": "Important Update",
  "body": "This is a custom message",
  "data": {
    "customKey": "customValue"
  }
}
```

---

## Troubleshooting

### Issue: "Cannot find device token"
**Solution**: Make sure the Service Worker registered properly and you accepted notification permissions in the browser.

### Issue: "Unauthorized" error when calling API
**Solution**: Include a valid JWT token in the Authorization header:
```
Authorization: Bearer [your-jwt-token]
```

To get a token:
1. Go to http://localhost:3000
2. Login with your credentials
3. In DevTools Network tab, find any API request and copy the Authorization header

### Issue: Notification not appearing when app is closed
**Solution**:
- Make sure Service Worker registered (check Console)
- Make sure you accepted notification permissions
- Notifications work only in supported browsers (Chrome, Firefox, Edge, etc.)

### Issue: CORS or connection errors
**Solution**:
- Verify backend is running: `npm run start:dev` in oldagehome-backend folder
- Check that FRONTEND_URL in backend .env matches your frontend URL

### Issue: Firebase authentication errors
**Solution**:
- Verify FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, and FIREBASE_CLIENT_EMAIL are set in `.env`
- Check that the private key has proper line breaks (the environment variable handles this)

---

## Next Steps for Production

1. **Add Notification History**: Store sent notifications in database for audit trail
2. **Scheduled Notifications**: Implement cron jobs for recurring reminders
3. **Notification Preferences**: Allow residents/caregivers to manage notification settings
4. **Rich Notifications**: Add images, actions, and interactive elements
5. **Analytics**: Track notification delivery success rates

---

## File Locations for Reference

- **Frontend FCM Service**: `oldagehome-frontend/lib/services/fcmService.ts`
- **Backend Notifications Service**: `oldagehome-backend/src/notifications/notifications.service.ts`
- **Backend Notifications Controller**: `oldagehome-backend/src/notifications/notifications.controller.ts`
- **Service Worker**: `oldagehome-frontend/public/firebase-messaging-sw.js`
- **Firebase Config**: `oldagehome-frontend/.env.local`

---

## Success Indicators ✅

- [ ] Service Worker registers successfully in browser console
- [ ] Notification permission prompt appears and is accepted
- [ ] Device token is generated and saved to backend
- [ ] API call with valid token returns 200 status
- [ ] Notification appears when app is in foreground (console message)
- [ ] Notification appears as OS notification when app is in background
- [ ] Backend logs show "✅ Sent to X devices" message

---

Good luck with your testing! 🚀
