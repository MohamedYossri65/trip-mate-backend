import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private readonly appId: string;
  private readonly restApiKey: string;
  private readonly apiUrl = 'https://onesignal.com/api/v1/notifications';

  constructor(private readonly configService: ConfigService) {
    this.appId = this.configService.get<string>('ONESIGNAL_APP_ID', '');
    this.restApiKey = this.configService.get<string>('ONESIGNAL_REST_API_KEY', '');

    if (!this.appId || !this.restApiKey) {
      this.logger.warn(
        'OneSignal credentials not configured. Push notifications will not be sent.',
      );
    }
  }

  /**
   * Send push notification to specific player IDs via OneSignal REST API
   */
  async sendPush(
    title: string,
    body: string,
    playerIds: string[],
    data?: Record<string, any>,
  ): Promise<boolean> {
    if (!this.appId || !this.restApiKey) {
      this.logger.warn('OneSignal not configured, skipping push');
      return false;
    }

    if (!playerIds.length) {
      this.logger.warn('No player IDs provided, skipping push');
      return false;
    }

    try {
      const payload: Record<string, any> = {
        app_id: this.appId,
        include_player_ids: playerIds,
        headings: { en: title },
        contents: { en: body },
      };

      if (data) {
        payload.data = data;
      }

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          Authorization: `Basic ${this.restApiKey}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.errors && result.errors.length > 0) {
        this.logger.error(`OneSignal errors: ${JSON.stringify(result.errors)}`);
        return false;
      }

      this.logger.log(
        `Push sent successfully. Recipients: ${result.recipients || 0}`,
      );
      return true;
    } catch (error) {
      this.logger.error(`Failed to send push notification: ${error.message}`);
      return false;
    }
  }

  /**
   * Send push to users by external user IDs (account IDs)
   */
  async sendPushByExternalIds(
    title: string,
    body: string,
    externalUserIds: string[],
    data?: Record<string, any>,
  ): Promise<boolean> {
    if (!this.appId || !this.restApiKey) {
      this.logger.warn('OneSignal not configured, skipping push');
      return false;
    }

    try {
      const payload: Record<string, any> = {
        app_id: this.appId,
        include_external_user_ids: externalUserIds,
        headings: { en: title },
        contents: { en: body },
      };

      if (data) {
        payload.data = data;
      }

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          Authorization: `Basic ${this.restApiKey}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.errors && result.errors.length > 0) {
        this.logger.error(`OneSignal errors: ${JSON.stringify(result.errors)}`);
        return false;
      }

      this.logger.log(
        `Push sent by external IDs. Recipients: ${result.recipients || 0}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send push by external IDs: ${error.message}`,
      );
      return false;
    }
  }

  /**
   * Send push notification to a OneSignal segment (e.g. "Subscribed Users")
   */
  async sendPushToSegment(
    title: string,
    body: string,
    segment: string,
    data?: Record<string, any>,
  ): Promise<boolean> {
    if (!this.appId || !this.restApiKey) {
      this.logger.warn('OneSignal not configured, skipping push');
      return false;
    }

    try {
      const payload: Record<string, any> = {
        app_id: this.appId,
        included_segments: [segment],
        headings: { en: title },
        contents: { en: body },
      };

      if (data) {
        payload.data = data;
      }

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          Authorization: `Basic ${this.restApiKey}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.errors && result.errors.length > 0) {
        this.logger.error(`OneSignal segment errors: ${JSON.stringify(result.errors)}`);
        return false;
      }

      this.logger.log(
        `Push sent to segment "${segment}". Recipients: ${result.recipients || 0}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send push to segment "${segment}": ${error.message}`,
      );
      return false;
    }
  }
}
