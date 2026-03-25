import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import {
  RegisterDeviceDto,
  NotificationQueryDto,
  RemoveDeviceDto,
  AdminSendSingleNotificationDto,
  AdminSendBulkNotificationDto,
} from './dto';
import { SendBulkNotificationDto } from './dto/bulk-notification.dto';
import { JwtAuthGuard } from 'src/common/guards/auth.guard';
import { Auth } from 'src/common/guards/decorators/auth.decorator';
import { RolesEnum } from 'src/common/enums/roles.enum';
import { CurrentUser } from 'src/common/guards/decorators/user.decorator';
import { Account } from '../account/entity/account.entity';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'Get user notifications (paginated)' })
  async getNotifications(
    @Query() query: NotificationQueryDto,
    @CurrentUser() user: Account,
  ) {
    return this.notificationService.getUserNotifications(user.id, query);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  async getUnreadCount(@CurrentUser() user: Account) {
    const count = await this.notificationService.getUnreadCount(user.id);
    return { unreadCount: count };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  async markAsRead(
    @CurrentUser() user: Account,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const accountId = user.id;
    return this.notificationService.markAsRead(id, accountId);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async markAllAsRead(@CurrentUser() user: Account) {
    const accountId = user.id;
    await this.notificationService.markAllAsRead(accountId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  async deleteNotification(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: Account,
  ) {
    return this.notificationService.deleteNotification(id, user.id);
  }


  // ─── Bulk Notifications (Admin only) ───────────────────────

  @Post('admin/send')
  @Auth(RolesEnum.ADMIN)
  @ApiOperation({ summary: 'Send direct notification to one user or one office (admin only)' })
  async sendDirectNotificationToSingleTarget(
    @Body() dto: AdminSendSingleNotificationDto,
  ) {
    return this.notificationService.sendDirectToSingleTarget(dto);
  }

  @Post('admin/send-bulk')
  @Auth(RolesEnum.ADMIN)
  @ApiOperation({ summary: 'Send direct notification to users, offices, or all (admin only)' })
  async sendDirectNotificationToBulkTargets(
    @Body() dto: AdminSendBulkNotificationDto,
  ) {
    return this.notificationService.sendDirectBulk(dto);
  }

  // ─── Device Management ─────────────────────────────────────

  @Post('devices')
  @ApiOperation({ summary: 'Register a device for push notifications' })
  async registerDevice(
    @CurrentUser() user: Account,
    @Body() dto: RegisterDeviceDto,
  ) {
    return this.notificationService.registerDevice(user.id, dto);
  }

  @Delete('devices')
  @ApiOperation({ summary: 'Remove a device from push notifications' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeDevice(
    @CurrentUser() user: Account,
    @Body() dto: RemoveDeviceDto,
  ) {
    const accountId = user.id;
    await this.notificationService.removeDevice(accountId, dto);
  }
}
