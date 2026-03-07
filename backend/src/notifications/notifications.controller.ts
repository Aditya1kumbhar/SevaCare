import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Post('send-to-device')
  async sendToDevice(
    @Body() body: {
      deviceToken: string;
      title: string;
      body: string;
      data?: { [key: string]: string };
    },
  ) {
    return this.notificationsService.sendToDevice(
      body.deviceToken,
      body.title,
      body.body,
      body.data,
    );
  }

  @Post('send-medication-reminder')
  async sendMedicationReminder(
    @Body() body: {
      deviceTokens: string[];
      residentName: string;
      medicationName: string;
      dose: string;
    },
  ): Promise<any> {
    return this.notificationsService.sendMedicationReminder(
      body.deviceTokens,
      body.residentName,
      body.medicationName,
      body.dose,
    );
  }

  @Post('send-health-alert')
  async sendHealthAlert(
    @Body() body: {
      deviceTokens: string[];
      residentName: string;
      alertType: string;
      message: string;
    },
  ): Promise<any> {
    return this.notificationsService.sendHealthAlert(
      body.deviceTokens,
      body.residentName,
      body.alertType,
      body.message,
    );
  }

  @Post('send-appointment-reminder')
  async sendAppointmentReminder(
    @Body() body: {
      deviceTokens: string[];
      residentName: string;
      appointmentType: string;
      time: string;
    },
  ): Promise<any> {
    return this.notificationsService.sendAppointmentReminder(
      body.deviceTokens,
      body.residentName,
      body.appointmentType,
      body.time,
    );
  }
}
