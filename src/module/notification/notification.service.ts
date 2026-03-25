import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Not, Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Notification } from './entity/notification.entity';
import { UserDevice } from './entity/user-device.entity';
import { Account } from 'src/module/account/entity/account.entity';
import { NotificationStatus, NotificationChannel } from './enums';
import { TemplateService } from './services/template.service';
import { RegisterDeviceDto, NotificationQueryDto, RemoveDeviceDto } from './dto';
import { SendBulkNotificationDto } from './dto/bulk-notification.dto';
import {
  AdminSendSingleNotificationDto,
  AdminSendBulkNotificationDto,
  SingleNotificationTargetType,
  BulkNotificationTargetType,
} from './dto';
import { RolesEnum } from 'src/common/enums/roles.enum';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { OfficeProfile } from 'src/module/office/entity/office.entity';
import { OfficeEmployee } from 'src/module/office/entity/employee.entity';
import { NotificationSource } from './enums/notification-source';

/** How many users to process per single Bull job */
const BULK_BATCH_SIZE = 500;
const ADMIN_DIRECT_TEMPLATE_KEY = 'ADMIN_DIRECT_MESSAGE';

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
    @InjectRepository(OfficeProfile)
    private readonly officeRepo: Repository<OfficeProfile>,
    @InjectRepository(OfficeEmployee)
    private readonly officeEmployeeRepo: Repository<OfficeEmployee>,
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

  async sendDirectToSingleTarget(
    dto: AdminSendSingleNotificationDto,
  ): Promise<{ totalRecipients: number; batchesQueued: number }> {
    const channel = dto.channel || NotificationChannel.PUSH;
    const accountIds = await this.resolveSingleTargetAccountIds(dto);

    if (accountIds.length === 0) {
      throw new NotFoundException('No recipients found for this target');
    }

    return this.queueDirectBulkJob(
      accountIds,
      dto.title,
      dto.body,
      channel,
      dto.data || {},
    );
  }

  async sendDirectBulk(
    dto: AdminSendBulkNotificationDto,
  ): Promise<{ totalRecipients: number; batchesQueued: number }> {
    const channel = dto.channel || NotificationChannel.PUSH;
    const accountIds = await this.resolveBulkTargetAccountIds(dto);

    if (accountIds.length === 0) {
      throw new NotFoundException('No recipients found for this target');
    }

    return this.queueDirectBulkJob(
      accountIds,
      dto.title,
      dto.body,
      channel,
      dto.data || {},
    );
  }

  // ─── User Notifications ────────────────────────────────────

  async getUserNotifications(
    accountId: bigint,
    query: NotificationQueryDto,
  ): Promise<PaginatedResponseDto<Notification>> {
    let qb = this.notificationRepo
      .createQueryBuilder('notification')
      .where('notification.accountId = :accountId', { accountId: accountId.toString() });

    // Filter by source
    if (query.source) {
      qb = qb.andWhere('notification.source = :source', { source: query.source });
    }

    // Filter by date range
    if (query.fromDate) {
      qb = qb.andWhere('notification.createdAt >= :fromDate', {
        fromDate: query.fromDate,
      });
    }

    if (query.toDate) {
      qb = qb.andWhere('notification.createdAt <= :toDate', { toDate: query.toDate });
    }

    // Search in title and body
    if (query.search) {
      qb = qb.andWhere(
        '(notification.title ILIKE :search OR notification.body ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    // Count total before pagination
    const total = await qb.getCount();

    // Apply pagination
    const data = await qb
      .orderBy('notification.createdAt', 'DESC')
      .skip(query.skip)
      .take(query.limit)
      .getMany();

    return new PaginatedResponseDto(data, total, query.page, query.limit);
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

  async getAllOfficeTeamAccountIds(): Promise<bigint[]> {
    const [officeOwners, officeEmployees] = await Promise.all([
      this.officeRepo.find({ select: ['accountId'] }),
      this.officeEmployeeRepo.find({
        where: {
          isActive: true,
          accountId: Not(IsNull()),
        },
        select: ['accountId'],
      }),
    ]);

    const uniqueIds = new Set<string>();

    for (const office of officeOwners) {
      uniqueIds.add(office.accountId.toString());
    }

    for (const employee of officeEmployees) {
      if (employee.accountId) {
        uniqueIds.add(employee.accountId.toString());
      }
    }

    return Array.from(uniqueIds, (id) => BigInt(id));
  }

  async getAdminAccountIds(): Promise<bigint[]> {
    const admins = await this.accountRepo.find({
      where: { role: RolesEnum.ADMIN },
      select: ['id'],
    });
    return admins.map((admin) => admin.id);
  }


  async deleteNotification(id: number, accountId: bigint): Promise<void> {
    const result = await this.notificationRepo.delete({ id, accountId });
    if (result.affected === 0) {
      throw new NotFoundException('Notification not found or not owned by user');
    }
  }

  private async resolveSingleTargetAccountIds(
    dto: AdminSendSingleNotificationDto,
  ): Promise<bigint[]> {
    if (dto.targetType === SingleNotificationTargetType.USER) {
      if (!dto.targetAccountId) {
        throw new BadRequestException(
          'targetAccountId is required when targetType is USER',
        );
      }

      return [BigInt(dto.targetAccountId)];
    }

    if (!dto.targetOfficeAccountId) {
      throw new BadRequestException(
        'targetOfficeAccountId is required when targetType is OFFICE',
      );
    }

    return this.getOfficeTeamAccountIds(BigInt(dto.targetOfficeAccountId));
  }

  private async resolveBulkTargetAccountIds(
    dto: AdminSendBulkNotificationDto,
  ): Promise<bigint[]> {
    if (dto.targetType === BulkNotificationTargetType.USERS) {
      if (!dto.targetAccountIds?.length) {
        throw new BadRequestException(
          'targetAccountIds is required when targetType is USERS',
        );
      }

      return dto.targetAccountIds.map((id) => BigInt(id));
    }

    if (dto.targetType === BulkNotificationTargetType.OFFICES) {
      if (!dto.targetOfficeAccountIds?.length) {
        throw new BadRequestException(
          'targetOfficeAccountIds is required when targetType is OFFICES',
        );
      }

      return this.getOfficeTeamAccountIdsByManyOffices(
        dto.targetOfficeAccountIds.map((id) => BigInt(id)),
      );
    }

    const accounts = await this.accountRepo.find({
      where: { role: In([RolesEnum.USER, RolesEnum.OFFICE]) },
      select: ['id'],
    });

    return accounts.map((account) => account.id);
  }

  private async getOfficeTeamAccountIds(
    officeAccountId: bigint,
  ): Promise<bigint[]> {
    const officeExists = await this.officeRepo.findOne({
      where: { accountId: officeAccountId },
      select: ['accountId'],
    });

    if (!officeExists) {
      throw new NotFoundException('Office not found');
    }

    const employees = await this.officeEmployeeRepo
      .createQueryBuilder('employee')
      .innerJoin('employee.office', 'office')
      .where('office.accountId = :officeAccountId', {
        officeAccountId: officeAccountId.toString(),
      })
      .andWhere('employee.isActive = :isActive', { isActive: true })
      .andWhere('employee.accountId IS NOT NULL')
      .select('employee.accountId', 'accountId')
      .getRawMany<{ accountId: string }>();

    const uniqueIds = new Set<string>([officeAccountId.toString()]);

    for (const employee of employees) {
      uniqueIds.add(employee.accountId);
    }

    return Array.from(uniqueIds, (id) => BigInt(id));
  }

  private async getOfficeTeamAccountIdsByManyOffices(
    officeAccountIds: bigint[],
  ): Promise<bigint[]> {
    const uniqueIds = new Set<string>();

    for (const officeId of officeAccountIds) {
      const officeTeamIds = await this.getOfficeTeamAccountIds(officeId);
      for (const accountId of officeTeamIds) {
        uniqueIds.add(accountId.toString());
      }
    }

    return Array.from(uniqueIds, (id) => BigInt(id));
  }

  private async queueDirectBulkJob(
    accountIds: bigint[],
    title: string,
    body: string,
    channel: NotificationChannel,
    data: Record<string, any>,
  ): Promise<{ totalRecipients: number; batchesQueued: number }> {
    const accountIdStrings = Array.from(
      new Set(accountIds.map((id) => id.toString())),
    );
    const batches = this.chunkArray(accountIdStrings, BULK_BATCH_SIZE);

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      await this.notificationQueue.add(
        'send-bulk-direct-batch',
        {
          templateKey: ADMIN_DIRECT_TEMPLATE_KEY,
          title,
          body,
          accountIds: batches[batchIndex],
          data,
          channel,
          batchIndex,
          totalBatches: batches.length,
          source: NotificationSource.ADMIN,
        },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 3000 },
          removeOnComplete: true,
        },
      );
    }

    this.logger.log(
      `Direct bulk notification queued: ${accountIdStrings.length} recipients in ${batches.length} batches`,
    );

    return {
      totalRecipients: accountIdStrings.length,
      batchesQueued: batches.length,
    };
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
