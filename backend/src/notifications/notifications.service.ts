import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger('NotificationsService');
  private readonly app: admin.app.App;

  constructor() {
    // Initialize Firebase Admin using environment variables
    const credentials = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    };

    if (!admin.apps.length) {
      this.app = admin.initializeApp({
        credential: admin.credential.cert(credentials as any),
      });
    } else {
      this.app = admin.app();
    }
  }

  /**
   * Send notification to a single device
   */
  async sendToDevice(
    deviceToken: string,
    title: string,
    body: string,
    data?: { [key: string]: string },
  ): Promise<string> {
    try {
      const message = {
        notification: {
          title,
          body,
        },
        data,
        token: deviceToken,
      };

      const response = await admin.messaging(this.app).send(message);
      this.logger.log(`✅ Notification sent: ${response}`);
      return response;
    } catch (error) {
      this.logger.error(`❌ Error sending notification: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send notification to multiple devices
   */
  async sendToMultipleDevices(
    deviceTokens: string[],
    title: string,
    body: string,
    data?: { [key: string]: string },
  ): Promise<any> {
    try {
      const messages = deviceTokens.map((token) => ({
        notification: {
          title,
          body,
        },
        data,
        token,
      }));

      const response = await admin.messaging(this.app).sendEach(messages);

      this.logger.log(`✅ Sent to ${response.successCount} devices`);
      if (response.failureCount > 0) {
        this.logger.warn(`⚠️ Failed to send to ${response.failureCount} devices`);
      }

      return response;
    } catch (error) {
      this.logger.error(`❌ Error sending to multiple devices: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send notification via topic (for broadcasts)
   */
  async sendToTopic(
    topic: string,
    title: string,
    body: string,
    data?: { [key: string]: string },
  ): Promise<string> {
    try {
      const message = {
        notification: {
          title,
          body,
        },
        data,
        topic,
      };

      const response = await admin.messaging(this.app).send(message);
      this.logger.log(`✅ Broadcast sent to topic: ${topic}`);
      return response;
    } catch (error) {
      this.logger.error(`❌ Error sending to topic: ${error.message}`);
      throw error;
    }
  }

  /**
   * Subscribe device to topic
   */
  async subscribeToTopic(
    deviceTokens: string[],
    topic: string,
  ): Promise<any> {
    try {
      const response = await admin
        .messaging(this.app)
        .subscribeToTopic(deviceTokens, topic);
      this.logger.log(`✅ Subscribed to topic: ${topic}`);
      return response;
    } catch (error) {
      this.logger.error(`❌ Error subscribing to topic: ${error.message}`);
      throw error;
    }
  }

  /**
   * Unsubscribe device from topic
   */
  async unsubscribeFromTopic(
    deviceTokens: string[],
    topic: string,
  ): Promise<any> {
    try {
      const response = await admin
        .messaging(this.app)
        .unsubscribeFromTopic(deviceTokens, topic);
      this.logger.log(`✅ Unsubscribed from topic: ${topic}`);
      return response;
    } catch (error) {
      this.logger.error(`❌ Error unsubscribing from topic: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send medication reminder
   */
  async sendMedicationReminder(
    deviceTokens: string[],
    residentName: string,
    medicationName: string,
    dose: string,
  ): Promise<admin.messaging.BatchResponse> {
    const title = '💊 Medication Reminder';
    const body = `${residentName} needs to take ${medicationName} (${dose})`;
    const data = {
      type: 'medication_reminder',
      residentName,
      medicationName,
      dose,
      timestamp: new Date().toISOString(),
    };

    return this.sendToMultipleDevices(deviceTokens, title, body, data);
  }

  /**
   * Send health alert
   */
  async sendHealthAlert(
    deviceTokens: string[],
    residentName: string,
    alertType: string,
    message: string,
  ): Promise<admin.messaging.BatchResponse> {
    const title = '🚨 Health Alert';
    const body = `${residentName}: ${message}`;
    const data = {
      type: 'health_alert',
      alertType,
      residentName,
      timestamp: new Date().toISOString(),
    };

    return this.sendToMultipleDevices(deviceTokens, title, body, data);
  }

  /**
   * Send appointment reminder
   */
  async sendAppointmentReminder(
    deviceTokens: string[],
    residentName: string,
    appointmentType: string,
    time: string,
  ): Promise<admin.messaging.BatchResponse> {
    const title = '📅 Appointment Reminder';
    const body = `${residentName} has ${appointmentType} at ${time}`;
    const data = {
      type: 'appointment_reminder',
      appointmentType,
      residentName,
      time,
      timestamp: new Date().toISOString(),
    };

    return this.sendToMultipleDevices(deviceTokens, title, body, data);
  }
}
