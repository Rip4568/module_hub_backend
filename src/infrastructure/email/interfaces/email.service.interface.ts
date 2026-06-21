export interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  template?: string;
  context?: Record<string, unknown>;
}

export interface IEmailService {
  send(options: EmailOptions): Promise<void>;
}

export const EMAIL_SERVICE = Symbol('EMAIL_SERVICE');
