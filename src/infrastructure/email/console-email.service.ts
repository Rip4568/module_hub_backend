import { Injectable, Logger } from '@nestjs/common';
import { EmailOptions, IEmailService } from './interfaces/email.service.interface';

const SENSITIVE_FIELD_PATTERN = /password|token|secret|apikey|credential/i;
const SENSITIVE_TEMPLATES = new Set(['forgot-password', 'user-invite', 'driver-invite']);

function redactSensitiveFields(
  value: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (!value) {
    return undefined;
  }

  const redacted: Record<string, unknown> = {};
  for (const [key, fieldValue] of Object.entries(value)) {
    redacted[key] = SENSITIVE_FIELD_PATTERN.test(key) ? '[REDACTED]' : fieldValue;
  }
  return redacted;
}

@Injectable()
export class ConsoleEmailService implements IEmailService {
  private readonly logger = new Logger(ConsoleEmailService.name);

  async send(options: EmailOptions): Promise<void> {
    const isSensitive = options.template ? SENSITIVE_TEMPLATES.has(options.template) : false;

    this.logger.log(
      JSON.stringify({
        event: 'email.sent',
        to: options.to,
        subject: options.subject,
        template: options.template,
        context: redactSensitiveFields(options.context),
        text: isSensitive ? '[REDACTED]' : options.text,
        html: options.html ? (isSensitive ? '[REDACTED]' : '[html body]') : undefined,
      }),
    );
  }
}
