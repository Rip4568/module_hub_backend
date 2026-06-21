import { Injectable, Logger, NotImplementedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailOptions, IEmailService } from './interfaces/email.service.interface';

/**
 * Resend email adapter — configure RESEND_API_KEY and EMAIL_FROM.
 * Install resend package when enabling in production.
 */
@Injectable()
export class ResendEmailService implements IEmailService {
  private readonly logger = new Logger(ResendEmailService.name);
  private readonly apiKey: string;
  private readonly from: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('RESEND_API_KEY', '');
    this.from = this.configService.get<string>('EMAIL_FROM', 'noreply@modulehub.app');

    if (!this.apiKey) {
      this.logger.warn('RESEND_API_KEY is not configured — Resend email is not operational');
    }
  }

  async send(_options: EmailOptions): Promise<void> {
    throw new NotImplementedException(
      'Resend email requires the resend package. Set EMAIL_PROVIDER=console for development.',
    );
  }
}
