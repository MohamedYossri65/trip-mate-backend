import { Injectable } from '@nestjs/common';
import { passwordResetEmail, verificationEmail } from './email.constants';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';

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

  async sendVerificationEmail(
    username: string,
    email: string,
    otp: string,
  ): Promise<{ success: boolean; message: string }> {
    const trimmedEmail = email.trim();
    try {
      await this.mailerService.sendMail({
        to: trimmedEmail,
        from: this.fromEmail,
        subject: 'Email Verification',
        text: 'Welcome to Alazhar',
        html: verificationEmail(username, otp),
      });
      return {
        success: true,
        message: `Verification email sent successfully to ${trimmedEmail}`,
      };
    } catch (error) {
      throw new Error(`Failed to send verification email: ${error.message}`);
    }
  }

  async sendPasswordResetEmail(
    email: string,
    verificationCode: string,
  ): Promise<{ success: boolean; message: string }> {
    const trimmedEmail = email.trim();
    try {
      await this.mailerService.sendMail({
        to: trimmedEmail,
        from: this.fromEmail,
        subject: 'Reset Password',
        text: 'Welcome to Opream',
        html: passwordResetEmail(verificationCode),
      });
      return {
        success: true,
        message: `Password reset email sent successfully to ${trimmedEmail}`,
      };
    } catch (error) {
      throw new Error(`Failed to send password reset email: ${error.message}`);
    }
  }
}
