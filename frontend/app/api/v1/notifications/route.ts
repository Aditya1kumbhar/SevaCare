import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth-middleware'

// Notifications routes — Firebase Admin SDK
// These endpoints handle push notification sending

let admin: any = null

async function getFirebaseAdmin() {
  if (admin) return admin
  
  const firebaseAdmin = await import('firebase-admin')
  
  const credentials = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  }

  if (!firebaseAdmin.apps.length) {
    firebaseAdmin.initializeApp({
      credential: firebaseAdmin.credential.cert(credentials as any),
    })
  }

  admin = firebaseAdmin
  return admin
}

// POST /api/v1/notifications
export async function POST(request: NextRequest) {
  try {
    verifyAuth(request)
    const body = await request.json()
    const { type, ...data } = body

    const firebaseAdmin = await getFirebaseAdmin()

    switch (type) {
      case 'send-to-device': {
        const message = {
          notification: { title: data.title, body: data.body },
          data: data.data,
          token: data.deviceToken,
        }
        const response = await firebaseAdmin.messaging().send(message)
        return NextResponse.json({ success: true, messageId: response })
      }

      case 'send-medication-reminder': {
        const title = '💊 Medication Reminder'
        const notifBody = `${data.residentName} needs to take ${data.medicationName} (${data.dose})`
        const messages = data.deviceTokens.map((token: string) => ({
          notification: { title, body: notifBody },
          data: {
            type: 'medication_reminder',
            residentName: data.residentName,
            medicationName: data.medicationName,
            dose: data.dose,
            timestamp: new Date().toISOString(),
          },
          token,
        }))
        const response = await firebaseAdmin.messaging().sendEach(messages)
        return NextResponse.json({
          success: true,
          successCount: response.successCount,
          failureCount: response.failureCount,
        })
      }

      case 'send-health-alert': {
        const title = '🚨 Health Alert'
        const alertBody = `${data.residentName}: ${data.message}`
        const messages = data.deviceTokens.map((token: string) => ({
          notification: { title, body: alertBody },
          data: {
            type: 'health_alert',
            alertType: data.alertType,
            residentName: data.residentName,
            timestamp: new Date().toISOString(),
          },
          token,
        }))
        const response = await firebaseAdmin.messaging().sendEach(messages)
        return NextResponse.json({
          success: true,
          successCount: response.successCount,
          failureCount: response.failureCount,
        })
      }

      case 'send-appointment-reminder': {
        const title = '📅 Appointment Reminder'
        const apptBody = `${data.residentName} has ${data.appointmentType} at ${data.time}`
        const messages = data.deviceTokens.map((token: string) => ({
          notification: { title, body: apptBody },
          data: {
            type: 'appointment_reminder',
            appointmentType: data.appointmentType,
            residentName: data.residentName,
            time: data.time,
            timestamp: new Date().toISOString(),
          },
          token,
        }))
        const response = await firebaseAdmin.messaging().sendEach(messages)
        return NextResponse.json({
          success: true,
          successCount: response.successCount,
          failureCount: response.failureCount,
        })
      }

      default:
        return NextResponse.json({ message: 'Unknown notification type' }, { status: 400 })
    }
  } catch (error: any) {
    if (error.message.includes('authorization') || error.message.includes('token')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    console.error('Notification error:', error)
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
