import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type SendSmsParams = {
  numbers: string[];
  msg: string;
  sender?: string;
  scheduledDatetime?: string; // Format: YYYY-MM-DDTHH:mm
  deleteId?: string;
};

type TaqnyatSendResponse = {
  statusCode: number;
  messageId?: number;
  cost?: number;
  currency?: string;
  totalCount?: number;
  msgLength?: number;
  accepted?: string;
  rejected?: string;
  message?: string;
};

type TaqnyatBalanceResponse = {
  statusCode: number;
  accountStatus?: string;
  accountExpiryDate?: string;
  balance?: string;
  currency?: string;
  message?: string;
};

type TaqnyatSender = {
  senderName: string;
  status: string;
  destination: string;
};

type TaqnyatSendersResponse = {
  statusCode: number;
  senders?: TaqnyatSender[];
  message?: string;
};

@Injectable()
export class TaqnyatSmsService {
  private readonly logger = new Logger(TaqnyatSmsService.name);
  private readonly baseUrl = 'https://api.taqnyat.sa';
  private readonly bearerToken: string;
  private readonly defaultSender: string;

  constructor(private readonly configService: ConfigService) {
    this.bearerToken = this.configService.get<string>('TAQNYAT_BEARER_TOKEN', '');
    this.defaultSender = this.configService.get<string>('TAQNYAT_SENDER', '');

    if (!this.bearerToken || !this.defaultSender) {
      this.logger.warn(
        'TAQNYAT credentials are not fully configured. SMS sending will fail until TAQNYAT_BEARER_TOKEN and TAQNYAT_SENDER are set.',
      );
    }
  }

  /**
   * Send SMS message(s) to one or multiple recipients
   * @param params - SMS parameters including numbers, message, sender, and optional scheduling
   * @returns Promise<boolean> - true if SMS sent successfully, false otherwise
   */
  async sendSms(params: SendSmsParams): Promise<boolean> {
    if (!this.bearerToken || !this.defaultSender) {
      this.logger.error('Skipping SMS send because TAQNYAT is not configured.');
      return false;
    }

    const formattedNumbers = params.numbers
      .map((number) => this.normalizeNumber(number))
      .filter(Boolean);

    if (!formattedNumbers.length) {
      this.logger.warn('No valid numbers to send SMS to.');
      return false;
    }

    if (formattedNumbers.length > 1000) {
      this.logger.error('Maximum 1000 recipients allowed per request.');
      return false;
    }

    try {
      const requestBody = {
        recipients: formattedNumbers,
        body: params.msg,
        sender: params.sender || this.defaultSender,
        ...(params.scheduledDatetime && { scheduledDatetime: params.scheduledDatetime }),
        ...(params.deleteId && { deleteId: params.deleteId }),
      };

      const response = await fetch(`${this.baseUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.bearerToken}`,
        },
        body: JSON.stringify(requestBody),
      });

      const result: TaqnyatSendResponse = await response.json();

      if (response.status === 201 && result.statusCode === 201) {
        this.logger.log(
          `SMS sent successfully via TAQNYAT to ${result.totalCount || formattedNumbers.length} recipient(s). ` +
          `MessageId: ${result.messageId}, Cost: ${result.cost} ${result.currency}`,
        );
        return true;
      }

      // Handle specific error cases
      if (response.status === 401) {
        this.logger.error('TAQNYAT authentication failed: Invalid bearer token');
      } else if (response.status === 400) {
        this.logger.error(`TAQNYAT rejected SMS: ${result.message || 'Bad request'}`);
      } else if (response.status === 405) {
        this.logger.error('TAQNYAT method not allowed');
      } else {
        this.logger.error(
          `TAQNYAT error ${response.status}: ${result.message || 'Unknown error'}`,
        );
      }

      return false;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to send SMS via TAQNYAT: ${message}`);
      return false;
    }
  }

  /**
   * Delete a scheduled SMS message
   * @param deleteId - The message ID to delete
   * @returns Promise<boolean> - true if deleted successfully, false otherwise
   */
  async deleteScheduledMessage(deleteId: string): Promise<boolean> {
    if (!this.bearerToken) {
      this.logger.error('Skipping delete because TAQNYAT is not configured.');
      return false;
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/v1/messages/delete?deleteId=${deleteId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.bearerToken}`,
          },
        },
      );

      const result = await response.json();

      if (response.status === 201 && result.statusCode === 201) {
        this.logger.log(`Scheduled message ${deleteId} deleted successfully`);
        return true;
      }

      if (response.status === 422) {
        this.logger.error(`Invalid deleteId: ${deleteId}`);
      } else {
        this.logger.error(
          `Failed to delete scheduled message: ${result.message || 'Unknown error'}`,
        );
      }

      return false;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to delete scheduled message: ${message}`);
      return false;
    }
  }

  /**
   * Get account balance and status
   * @returns Promise<TaqnyatBalanceResponse | null>
   */
  async getAccountBalance(): Promise<TaqnyatBalanceResponse | null> {
    if (!this.bearerToken) {
      this.logger.error('Cannot get balance because TAQNYAT is not configured.');
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}/account/balance`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.bearerToken}`,
        },
      });

      const result: TaqnyatBalanceResponse = await response.json();

      if (response.status === 200 && result.statusCode === 200) {
        this.logger.log(
          `Account balance: ${result.balance} ${result.currency}, Status: ${result.accountStatus}`,
        );
        return result;
      }

      this.logger.error(
        `Failed to get account balance: ${result.message || 'Unknown error'}`,
      );
      return null;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to get account balance: ${message}`);
      return null;
    }
  }

  /**
   * Get list of active sender names
   * @returns Promise<TaqnyatSender[] | null>
   */
  async getSenderNames(): Promise<TaqnyatSender[] | null> {
    if (!this.bearerToken) {
      this.logger.error('Cannot get senders because TAQNYAT is not configured.');
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}/v1/messages/senders`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.bearerToken}`,
        },
      });

      const result: TaqnyatSendersResponse = await response.json();

      if (response.status === 201 && result.statusCode === 201 && result.senders) {
        this.logger.log(`Retrieved ${result.senders.length} sender name(s)`);
        return result.senders;
      }

      this.logger.error(
        `Failed to get sender names: ${result.message || 'Unknown error'}`,
      );
      return null;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to get sender names: ${message}`);
      return null;
    }
  }

  /**
   * Check system status
   * @returns Promise<boolean> - true if system is operational
   */
  async checkSystemStatus(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/system/status`, {
        method: 'GET',
      });

      const result = await response.json();

      if (response.status === 200 && result.statusCode === 200) {
        this.logger.log(`System status: ${result.status?.description || 'Operational'}`);
        return true;
      }

      return false;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to check system status: ${message}`);
      return false;
    }
  }

  /**
   * Normalize phone number to international format without 00 or +
   * @param number - Phone number to normalize
   * @returns Normalized phone number
   */
  private normalizeNumber(number: string): string {
    let normalized = number.trim();

    // Remove + prefix
    if (normalized.startsWith('+')) {
      normalized = normalized.slice(1);
    }

    // Remove 00 prefix
    if (normalized.startsWith('00')) {
      normalized = normalized.slice(2);
    }

    // Remove all non-digit characters
    return normalized.replace(/\D/g, '');
  }
}
