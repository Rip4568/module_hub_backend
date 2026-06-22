import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailOptions, IEmailService } from './interfaces/email.service.interface';

@Injectable()
export class ResendEmailService implements IEmailService {
  private readonly logger = new Logger(ResendEmailService.name);
  private readonly apiKey: string;
  private readonly from: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('RESEND_API_KEY', '');
    this.from = this.configService.get<string>('EMAIL_FROM', 'noreply@modulehub.app');

    if (!this.apiKey && process.env.NODE_ENV !== 'production') {
      this.logger.warn('RESEND_API_KEY is not configured — Resend email is not operational');
    }
  }

  async send(options: EmailOptions): Promise<void> {
    if (!this.apiKey) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: this.from,
        to: [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      this.logger.error(`Resend API error (${response.status}): ${body}`);
      throw new Error(`Failed to send email via Resend (${response.status})`);
    }

    this.logger.debug(`Email sent via Resend to ${options.to}`);
  }
}
