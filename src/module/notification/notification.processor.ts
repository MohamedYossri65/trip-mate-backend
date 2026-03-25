import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { NotificationService } from './notification.service';
import { PushService } from './channels/push.service';
import { TemplateService } from './services/template.service';
import { NotificationStatus, NotificationChannel } from './enums';
import { NotificationSource } from './enums/notification-source';

@Processor('notification-queue')
export class NotificationProcessor {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    private readonly notificationService: NotificationService,
    private readonly pushService: PushService,
    private readonly templateService: TemplateService,
  ) {}

  @Process('send')
  async handleSend(job: Job<{ notificationId: number }>): Promise<void> {
    const { notificationId } = job.data;

    this.logger.log(`Processing notification id=${notificationId}`);

    const notification =
      await this.notificationService.findNotificationById(notificationId);

    if (!notification) {
      this.logger.error(`Notification id=${notificationId} not found`);
      return;
    }

    try {
      let success = false;

      switch (notification.channel) {
        case NotificationChannel.PUSH:
          // Get device tokens for the user
          const tokens = await this.notificationService.getDeviceTokens(
            notification.accountId,
          );

          if (tokens.length > 0) {
            success = await this.pushService.sendPush(
              notification.title,
              notification.body,
              tokens,
              {
                type: notification.templateKey,
                notificationId: notification.id.toString(),
                ...notification.data,
              },
            );
          } else {
            // Fallback: try sending by external user ID
            success = await this.pushService.sendPushByExternalIds(
              notification.title,
              notification.body,
              [notification.accountId.toString()],
              {
                type: notification.templateKey,
                notificationId: notification.id.toString(),
                ...notification.data,
              },
            );
          }
          break;

        case NotificationChannel.IN_APP:
          // In-app notifications are already saved to DB, just mark as sent
          success = true;
          break;

        case NotificationChannel.EMAIL:
          // TODO: implement email channel
          this.logger.warn('Email channel not yet implemented');
          success = false;
          break;

        case NotificationChannel.SMS:
          // TODO: implement SMS channel
          this.logger.warn('SMS channel not yet implemented');
          success = false;
          break;

        default:
          this.logger.warn(`Unknown channel: ${notification.channel}`);
          break;
      }

      const newStatus = success
        ? NotificationStatus.SENT
        : NotificationStatus.FAILED;

      await this.notificationService.updateStatus(notification.id, newStatus);

      this.logger.log(
        `Notification id=${notificationId} processed, status=${newStatus}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process notification id=${notificationId}: ${error.message}`,
      );
      await this.notificationService.updateStatus(
        notification.id,
        NotificationStatus.FAILED,
      );
      throw error; // Let Bull retry
    }
  }

  // ─── Bulk: per-batch handler ────────────────────────────────

  @Process('send-bulk-batch')
  async handleSendBulkBatch(
    job: Job<{
      templateKey: string;
      accountIds: string[];
      data: Record<string, any>;
      channel: NotificationChannel;
      batchIndex: number;
      totalBatches: number;
    }>,
  ): Promise<void> {
    const { templateKey, accountIds, data, channel, batchIndex, totalBatches } =
      job.data;

    this.logger.log(
      `Processing bulk batch ${batchIndex + 1}/${totalBatches} – ${accountIds.length} recipients`,
    );

    let successCount = 0;
    let failCount = 0;

    for (const accountIdStr of accountIds) {
      const accountId = BigInt(accountIdStr);

      try {
        const rendered = await this.templateService.buildNotification(
          templateKey,
          accountId,
          data,
          channel,
        );

        if (!rendered) {
          this.logger.warn(
            `Could not render template "${templateKey}" for account=${accountId}`,
          );
          failCount++;
          continue;
        }

        // Persist the notification record
        const [saved] = await this.notificationService.saveBulkNotifications([
          {
            accountId,
            templateKey,
            title: rendered.title,
            body: rendered.body,
            channel,
            status: NotificationStatus.PENDING,
            data,
          },
        ]);

        // Deliver through the appropriate channel
        let success = false;

        switch (channel) {
          case NotificationChannel.PUSH:
            const tokens =
              await this.notificationService.getDeviceTokens(accountId);
            if (tokens.length > 0) {
              success = await this.pushService.sendPush(
                rendered.title,
                rendered.body,
                tokens,
                { type: templateKey, notificationId: saved.id.toString(), ...data },
              );
            } else {
              success = await this.pushService.sendPushByExternalIds(
                rendered.title,
                rendered.body,
                [accountIdStr],
                { type: templateKey, notificationId: saved.id.toString(), ...data },
              );
            }
            break;

          case NotificationChannel.IN_APP:
            success = true;
            break;

          default:
            this.logger.warn(`Channel "${channel}" not yet implemented for bulk`);
            break;
        }

        await this.notificationService.updateStatus(
          saved.id,
          success ? NotificationStatus.SENT : NotificationStatus.FAILED,
        );

        success ? successCount++ : failCount++;
      } catch (error) {
        this.logger.error(
          `Bulk send failed for account=${accountIdStr}: ${error.message}`,
        );
        failCount++;
      }
    }

    this.logger.log(
      `Bulk batch ${batchIndex + 1}/${totalBatches} done – sent=${successCount}, failed=${failCount}`,
    );
  }

  @Process('send-bulk-direct-batch')
  async handleSendDirectBulkBatch(
    job: Job<{
      templateKey: string;
      title: string;
      body: string;
      accountIds: string[];
      data: Record<string, any>;
      channel: NotificationChannel;
      batchIndex: number;
      totalBatches: number;
    }>,
  ): Promise<void> {
    const {
      templateKey,
      title,
      body,
      accountIds,
      data,
      channel,
      batchIndex,
      totalBatches,
    } = job.data;

    this.logger.log(
      `Processing direct bulk batch ${batchIndex + 1}/${totalBatches} – ${accountIds.length} recipients`,
    );

    let successCount = 0;
    let failCount = 0;

    for (const accountIdStr of accountIds) {
      const accountId = BigInt(accountIdStr);

      try {
        const [saved] = await this.notificationService.saveBulkNotifications([
          {
            accountId,
            templateKey,
            title,
            body,
            channel,
            status: NotificationStatus.PENDING,
            data,
            source: NotificationSource.ADMIN,
          },
        ]);

        let success = false;

        switch (channel) {
          case NotificationChannel.PUSH:
            const tokens =
              await this.notificationService.getDeviceTokens(accountId);
            if (tokens.length > 0) {
              success = await this.pushService.sendPush(
                title,
                body,
                tokens,
                { type: templateKey, notificationId: saved.id.toString(), ...data },
              );
            } else {
              success = await this.pushService.sendPushByExternalIds(
                title,
                body,
                [accountIdStr],
                { type: templateKey, notificationId: saved.id.toString(), ...data },
              );
            }
            break;

          case NotificationChannel.IN_APP:
            success = true;
            break;

          default:
            this.logger.warn(
              `Channel "${channel}" not yet implemented for direct bulk`,
            );
            break;
        }

        await this.notificationService.updateStatus(
          saved.id,
          success ? NotificationStatus.SENT : NotificationStatus.FAILED,
        );

        success ? successCount++ : failCount++;
      } catch (error) {
        this.logger.error(
          `Direct bulk send failed for account=${accountIdStr}: ${error.message}`,
        );
        failCount++;
      }
    }

    this.logger.log(
      `Direct bulk batch ${batchIndex + 1}/${totalBatches} done – sent=${successCount}, failed=${failCount}`,
    );
  }

  // ─── Bulk: segment handler ─────────────────────────────────

  @Process('send-bulk-segment')
  async handleSendBulkSegment(
    job: Job<{
      templateKey: string;
      segment: string;
      data: Record<string, any>;
    }>,
  ): Promise<void> {
    const { templateKey, segment, data } = job.data;

    this.logger.log(`Processing bulk segment push: segment="${segment}"`);

    try {
      // For segment pushes we render the template with the default language
      const rendered = await this.templateService.getTemplate(
        templateKey,
        process.env.DEFAULT_LANGUAGE || 'ar',
        NotificationChannel.PUSH,
      );

      if (!rendered) {
        this.logger.error(
          `Template "${templateKey}" not found for segment push`,
        );
        return;
      }

      const title = this.templateService.render(rendered.titleTemplate, data);
      const body = this.templateService.render(rendered.bodyTemplate, data);

      const success = await this.pushService.sendPushToSegment(
        title,
        body,
        segment,
        { type: templateKey, ...data },
      );

      this.logger.log(
        `Segment push "${segment}" ${success ? 'sent' : 'failed'}`,
      );
    } catch (error) {
      this.logger.error(
        `Segment push "${segment}" failed: ${error.message}`,
      );
      throw error;
    }
  }
}
