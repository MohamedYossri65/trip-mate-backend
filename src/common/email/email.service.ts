import { Injectable } from '@nestjs/common';
import { passwordResetEmail, verificationEmail } from './email.constants';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';

export interface SendEmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

@Injectable()
export class ServerEmailService {
  private readonly fromEmail: string;

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {
    this.fromEmail =
      this.configService.getOrThrow<string>('SMTP_FROM') ||
      '"opream-support" <onway@opream.net>';
  }

  async sendEmail(
    options: SendEmailOptions,
  ): Promise<{ success: boolean; message: string }> {
    const trimmedEmail = options.to.trim();
    try {
      await this.mailerService.sendMail({
        to: trimmedEmail,
        from: this.fromEmail,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });
      return {
        success: true,
        message: `Email sent successfully to ${trimmedEmail}`,
      };
    } catch (error: any) {
      throw new Error(`Failed to send email: ${error?.message || 'Unknown error'}`);
    }
  }
}
