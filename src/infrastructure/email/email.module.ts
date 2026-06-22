import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EMAIL_SERVICE } from './interfaces/email.service.interface';
import { ConsoleEmailService } from './console-email.service';
import { ResendEmailService } from './resend-email.service';
import { SmtpEmailService } from './smtp-email.service';
import { EmailTemplateService } from './email-template.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    ConsoleEmailService,
    ResendEmailService,
    SmtpEmailService,
    EmailTemplateService,
    {
      provide: EMAIL_SERVICE,
      useFactory: (
        configService: ConfigService,
        console: ConsoleEmailService,
        resend: ResendEmailService,
        smtp: SmtpEmailService,
      ) => {
        const provider = configService.get<string>('EMAIL_PROVIDER', 'console');
        if (provider === 'resend') return resend;
        if (provider === 'smtp') return smtp;
        return console;
      },
      inject: [ConfigService, ConsoleEmailService, ResendEmailService, SmtpEmailService],
    },
  ],
  exports: [EMAIL_SERVICE, EmailTemplateService],
})
export class EmailModule {}
