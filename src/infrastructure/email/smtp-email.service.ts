import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { EmailOptions, IEmailService } from './interfaces/email.service.interface';

/**
 * SMTP email adapter — configure SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE, EMAIL_FROM.
 */
@Injectable()
export class SmtpEmailService implements IEmailService {
  private readonly logger = new Logger(SmtpEmailService.name);
  private readonly transporter: nodemailer.Transporter | null;
  private readonly from: string;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST', '');
    this.from = this.configService.get<string>('EMAIL_FROM', 'noreply@modulehub.app');

    if (!host) {
      this.logger.warn('SMTP_HOST is not configured — SMTP email is not operational');
      this.transporter = null;
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port: Number(this.configService.get<string>('SMTP_PORT', '587')),
      secure: this.configService.get<string>('SMTP_SECURE', 'false') === 'true',
      auth: {
        user: this.configService.get<string>('SMTP_USER', ''),
        pass: this.configService.get<string>('SMTP_PASS', ''),
      },
    });
  }

  async send(options: EmailOptions): Promise<void> {
    if (!this.transporter) {
      throw new Error('SMTP is not configured (SMTP_HOST missing)');
    }

    await this.transporter.sendMail({
      from: this.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    this.logger.debug(`Email sent via SMTP to ${options.to}`);
  }
}
