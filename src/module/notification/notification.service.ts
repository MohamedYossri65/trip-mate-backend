import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Notification } from './entity/notification.entity';
import { UserDevice } from './entity/user-device.entity';
import { Account } from 'src/module/account/entity/account.entity';
import { NotificationStatus, NotificationChannel } from './enums';
import { TemplateService } from './services/template.service';
import { RegisterDeviceDto, NotificationQueryDto, RemoveDeviceDto } from './dto';
import { SendBulkNotificationDto } from './dto/bulk-notification.dto';
import { RolesEnum } from 'src/common/enums/roles.enum';

/** How many users to process per single Bull job */
const BULK_BATCH_SIZE = 500;

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    @InjectRepository(UserDevice)
    private readonly deviceRepo: Repository<UserDevice>,
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
    @InjectQueue('notification-queue')
    private readonly notificationQueue: Queue,
    private readonly templateService: TemplateService,
  ) {}

  // ─── Create & Queue (single user) ─────────────────────────

  /**
   * Render template, save notification to DB, add job to queue
   */
  async createAndQueue(
    templateKey: string,
    accountId: bigint,
    data: Record<string, any>,
    channels: NotificationChannel[] = [NotificationChannel.PUSH],
  ): Promise<Notification[]> {
    const notifications: Notification[] = [];

    for (const channel of channels) {
      const rendered = await this.templateService.buildNotification(
        templateKey,
        accountId,
        data,
        channel,
      );

      if (!rendered) {
        this.logger.warn(
          `Could not render template "${templateKey}" for account=${accountId}, channel=${channel}`,
        );
        continue;
      }

      // Save to DB
      const notification = this.notificationRepo.create({
        accountId,
        templateKey,
        title: rendered.title,
        body: rendered.body,
        channel,
        status: NotificationStatus.PENDING,
        data,
      });

      const saved = await this.notificationRepo.save(notification);
      notifications.push(saved);

      // Add to queue
      await this.notificationQueue.add(
        'send',
        { notificationId: saved.id },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: true,
        },
      );

      this.logger.log(
        `Notification queued: id=${saved.id}, key="${templateKey}", channel=${channel}`,
      );
    }

    return notifications;
  }

  // ─── Bulk Notifications (1K – 100K+ users) ────────────────

  /**
   * Send to many users at once.
   *
   * Strategy:
   *  • If a OneSignal `segment` is given → fire one API call (instant, no per-user DB rows).
   *  • If `accountIds` are given → split into batches of 500, each batch = 1 Bull job.
   *  • If neither → load ALL account IDs from DB and batch them.
   */
  async sendBulk(
    dto: SendBulkNotificationDto,
  ): Promise<{ totalRecipients: number; batchesQueued: number }> {
    const channel = dto.channel || NotificationChannel.PUSH;

    // ── Fast path: OneSignal segment (no per-user records) ───
    if (dto.segment && channel === NotificationChannel.PUSH) {
      await this.notificationQueue.add(
        'send-bulk-segment',
        {
          templateKey: dto.templateKey,
          segment: dto.segment,
          data: dto.data || {},
        },
        { attempts: 3, backoff: { type: 'exponential', delay: 3000 }, removeOnComplete: true },
      );

      this.logger.log(`Bulk push via segment "${dto.segment}" queued`);
      return { totalRecipients: -1, batchesQueued: 1 }; // -1 = unknown, OneSignal handles it
    }

    // ── Resolve target account IDs ──────────────────────────
    let accountIds: string[];

    if (dto.accountIds && dto.accountIds.length > 0) {
      accountIds = dto.accountIds;
    } else {
      // Load ALL user IDs from DB
      const accounts = await this.accountRepo.find({ select: ['id'] });
      accountIds = accounts.map((a) => a.id.toString());
    }

    // ── Split into batches and queue each batch ─────────────
    const batches = this.chunkArray(accountIds, BULK_BATCH_SIZE);
    let batchIndex = 0;

    for (const batch of batches) {
      await this.notificationQueue.add(
        'send-bulk-batch',
        {
          templateKey: dto.templateKey,
          accountIds: batch,
          data: dto.data || {},
          channel,
          batchIndex,
          totalBatches: batches.length,
        },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 3000 },
          removeOnComplete: true,
        },
      );
      batchIndex++;
    }

    this.logger.log(
      `Bulk notification queued: ${accountIds.length} recipients in ${batches.length} batches`,
    );

    return { totalRecipients: accountIds.length, batchesQueued: batches.length };
  }

  // ─── User Notifications ────────────────────────────────────

  async getUserNotifications(
    accountId: bigint,
    query: NotificationQueryDto,
  ): Promise<{ data: Notification[]; total: number; page: number; limit: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [data, total] = await this.notificationRepo.findAndCount({
      where: { accountId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async getUnreadCount(accountId: bigint): Promise<number> {
    return this.notificationRepo.count({
      where: {
        accountId,
        readAt: IsNull(),
      },
    });
  }

  async markAsRead(notificationId: number, accountId: bigint): Promise<Notification> {
    const notification = await this.notificationRepo.findOne({
      where: { id: notificationId, accountId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    notification.readAt = new Date();
    notification.status = NotificationStatus.READ;

    return this.notificationRepo.save(notification);
  }

  async markAllAsRead(accountId: bigint): Promise<void> {
    await this.notificationRepo.update(
      { accountId, readAt: IsNull() },
      { readAt: new Date(), status: NotificationStatus.READ },
    );
  }

  // ─── Device Management ─────────────────────────────────────

  async registerDevice(
    accountId: bigint,
    dto: RegisterDeviceDto,
  ): Promise<UserDevice> {
    // Upsert: if token already exists, update the owner
    let device = await this.deviceRepo.findOne({
      where: { deviceToken: dto.deviceToken },
    });

    if (device) {
      device.accountId = accountId;
      device.deviceType = dto.deviceType;
      device.appVersion = dto.appVersion || device.appVersion;
      device.lastSeen = new Date();
    } else {
      device = this.deviceRepo.create({
        accountId,
        deviceToken: dto.deviceToken,
        deviceType: dto.deviceType,
        appVersion: dto.appVersion,
      });
    }

    return this.deviceRepo.save(device);
  }

  async removeDevice(accountId: bigint, dto: RemoveDeviceDto): Promise<void> {
    await this.deviceRepo.delete({
      accountId,
      deviceToken: dto.deviceToken,
    });
  }

  async getDeviceTokens(accountId: bigint): Promise<string[]> {
    const devices = await this.deviceRepo.find({
      where: { accountId },
    });
    return devices.map((d) => d.deviceToken);
  }

  // ─── Internal ──────────────────────────────────────────────

  async findNotificationById(id: number): Promise<Notification | null> {
    return this.notificationRepo.findOne({ where: { id } });
  }

  async updateStatus(id: number, status: NotificationStatus): Promise<void> {
    await this.notificationRepo.update(id, { status });
  }

  /**
   * Save a batch of notifications in bulk (used by the bulk processor)
   */
  async saveBulkNotifications(
    records: Partial<Notification>[],
  ): Promise<Notification[]> {
    const entities = this.notificationRepo.create(records);
    return this.notificationRepo.save(entities, { chunk: 200 });
  }

  // ─── Role-based queries ─────────────────────────────────────

  async getAccountIdsByRole(role: RolesEnum): Promise<bigint[]> {
    const accounts = await this.accountRepo.find({
      where: { role },
      select: ['id'],
    });
    return accounts.map((a) => a.id);
  }

  // ─── Helpers ───────────────────────────────────────────────

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}
