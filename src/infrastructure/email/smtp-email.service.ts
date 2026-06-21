import { Injectable, Logger, NotImplementedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailOptions, IEmailService } from './interfaces/email.service.interface';

/**
 * SMTP email adapter — configure SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM.
 * Install nodemailer when enabling in production.
 */
@Injectable()
export class SmtpEmailService implements IEmailService {
  private readonly logger = new Logger(SmtpEmailService.name);

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST', '');
    if (!host) {
      this.logger.warn('SMTP_HOST is not configured — SMTP email is not operational');
    }
  }

  async send(_options: EmailOptions): Promise<void> {
    throw new NotImplementedException(
      'SMTP email requires nodemailer. Set EMAIL_PROVIDER=console for development.',
    );
  }
}
