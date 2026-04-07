import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type SendSmsParams = {
  numbers: string[];
  msg: string;
  userSender?: string;
  msgEncoding?: 'UTF8' | 'windows-1256';
  reqBulkId?: boolean;
  reqFilter?: boolean;
  reqDlr?: boolean;
  by?: string;
};

@Injectable()
export class MsegatSmsService {
  private readonly logger = new Logger(MsegatSmsService.name);
  private readonly endpoint = 'https://www.msegat.com/gw/sendsms.php';
  private readonly userName: string;
  private readonly apiKey: string;
  private readonly defaultSender: string;

  constructor(private readonly configService: ConfigService) {
    this.userName = this.configService.get<string>('MSEGAT_USERNAME', '');
    this.apiKey = this.configService.get<string>('MSEGAT_API_KEY', '');
    this.defaultSender = this.configService.get<string>('MSEGAT_SENDER', '');

    if (!this.userName || !this.apiKey || !this.defaultSender) {
      this.logger.warn(
        'MSEGAT credentials are not fully configured. SMS sending will fail until MSEGAT_USERNAME, MSEGAT_API_KEY, and MSEGAT_SENDER are set.',
      );
    }
  }

  async sendSms(params: SendSmsParams): Promise<boolean> {
    if (!this.userName || !this.apiKey || !this.defaultSender) {
      this.logger.error('Skipping SMS send because MSEGAT is not configured.');
      return false;
    }

    const formattedNumbers = params.numbers
      .map((number) => this.normalizeNumber(number))
      .filter(Boolean);

    if (!formattedNumbers.length) {
      this.logger.warn('No valid numbers to send SMS to.');
      return false;
    }

    const body = new URLSearchParams({
      userName: this.userName,
      apiKey: this.apiKey,
      numbers: formattedNumbers.join(','),
      userSender: params.userSender || this.defaultSender,
      msg: params.msg,
      msgEncoding: params.msgEncoding || 'UTF8',
      reqBulkId: String(params.reqBulkId ?? false),
      reqFilter: String(params.reqFilter ?? true),
      reqDlr: String(params.reqDlr ?? false),
      By: params.by || 'TripMateBackend',
    });

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      });

      const raw = (await response.text()).trim();
      const parsed = this.parseResponseCode(raw);

      if (!response.ok) {
        this.logger.error(
          `MSEGAT HTTP error ${response.status}: ${raw || 'empty response'}`,
        );
        return false;
      }

      if (!this.isSuccessCode(parsed.code)) {
        this.logger.error(
          `MSEGAT rejected SMS: code=${parsed.code || 'unknown'}, message=${parsed.message || raw || 'N/A'}`,
        );
        return false;
      }

      this.logger.log(
        `SMS sent successfully via MSEGAT to ${formattedNumbers.length} recipient(s).`,
      );
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to send SMS via MSEGAT: ${message}`);
      return false;
    }
  }

  private normalizeNumber(number: string): string {
    let normalized = number.trim();

    if (normalized.startsWith('+')) {
      normalized = normalized.slice(1);
    }

    if (normalized.startsWith('00')) {
      normalized = normalized.slice(2);
    }

    return normalized.replace(/\D/g, '');
  }

  private parseResponseCode(raw: string): { code: string; message?: string } {
    if (!raw) {
      return { code: '' };
    }

    try {
      const json = JSON.parse(raw);
      if (json && typeof json === 'object') {
        const code = String((json.code as string | number | undefined) ?? '');
        const message =
          typeof json.message === 'string' ? json.message : undefined;
        return { code, message };
      }
    } catch {
      // Response is not JSON in many MSEGAT endpoints.
    }

    return { code: raw };
  }

  private isSuccessCode(code: string): boolean {
    const normalized = code.trim();
    return normalized === '1' || normalized === 'M0000';
  }
}