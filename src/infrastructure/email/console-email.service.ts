import { Injectable, Logger } from '@nestjs/common';
import { EmailOptions, IEmailService } from './interfaces/email.service.interface';

@Injectable()
export class ConsoleEmailService implements IEmailService {
  private readonly logger = new Logger(ConsoleEmailService.name);

  async send(options: EmailOptions): Promise<void> {
    this.logger.log(
      JSON.stringify({
        event: 'email.sent',
        to: options.to,
        subject: options.subject,
        template: options.template,
        context: options.context,
        text: options.text,
        html: options.html ? '[html body]' : undefined,
      }),
    );
  }
}
