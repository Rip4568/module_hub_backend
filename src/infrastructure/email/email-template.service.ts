import { Inject, Injectable } from '@nestjs/common';
import { EMAIL_SERVICE, IEmailService } from './interfaces/email.service.interface';

@Injectable()
export class EmailTemplateService {
  constructor(@Inject(EMAIL_SERVICE) private readonly emailService: IEmailService) {}

  async sendDriverInvite(params: {
    to: string;
    name: string;
    tenantName: string;
    tempPassword?: string;
    isNewUser: boolean;
  }): Promise<void> {
    const subject = params.isNewUser
      ? `Welcome to ${params.tenantName} — Driver Invitation`
      : `You have been invited to join ${params.tenantName}`;

    const text = params.isNewUser
      ? `Hello ${params.name},\n\nYou have been invited as a driver at ${params.tenantName}.\nYour temporary password: ${params.tempPassword}\n\nPlease log in and change your password.`
      : `Hello ${params.name},\n\nYou have been invited to join ${params.tenantName} as a driver. Log in with your existing account.`;

    await this.emailService.send({
      to: params.to,
      subject,
      text,
      template: 'driver-invite',
      context: params,
    });
  }

  async sendUserInvite(params: {
    to: string;
    name: string;
    tenantName: string;
    tempPassword: string;
  }): Promise<void> {
    await this.emailService.send({
      to: params.to,
      subject: `Welcome to ${params.tenantName}`,
      text: `Hello ${params.name},\n\nYou have been invited to ${params.tenantName}.\nYour temporary password: ${params.tempPassword}\n\nPlease log in and change your password.`,
      template: 'user-invite',
      context: params,
    });
  }

  async sendForgotPassword(params: {
    to: string;
    name: string;
    resetToken: string;
  }): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password?token=${params.resetToken}`;

    await this.emailService.send({
      to: params.to,
      subject: 'Reset your password',
      text: `Hello ${params.name},\n\nClick the link below to reset your password:\n${resetUrl}\n\nThis link expires in 1 hour.`,
      template: 'forgot-password',
      context: { ...params, resetUrl },
    });
  }
}
