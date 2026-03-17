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
import { RegisterDeviceDto, NotificationQueryDto, RemoveDeviceDto } from './dto';
import { SendBulkNotificationDto } from './dto/bulk-notification.dto';
import { JwtAuthGuard } from 'src/common/guards/auth.guard';
import { Auth } from 'src/common/guards/decorators/auth.decorator';
import { RolesEnum } from 'src/common/enums/roles.enum';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'Get user notifications (paginated)' })
  async getNotifications(
    @Req() req: any,
    @Query() query: NotificationQueryDto,
  ) {
    const accountId = BigInt(req.user.sub);
    return this.notificationService.getUserNotifications(accountId, query);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  async getUnreadCount(@Req() req: any) {
    const accountId = BigInt(req.user.sub);
    const count = await this.notificationService.getUnreadCount(accountId);
    return { unreadCount: count };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  async markAsRead(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const accountId = BigInt(req.user.sub);
    return this.notificationService.markAsRead(id, accountId);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async markAllAsRead(@Req() req: any) {
    const accountId = BigInt(req.user.sub);
    await this.notificationService.markAllAsRead(accountId);
  }

  // ─── Bulk Notifications (Admin only) ───────────────────────

  @Post('bulk')
  @Auth(RolesEnum.ADMIN)
  @ApiOperation({ summary: 'Send bulk notifications (admin only)' })
  async sendBulkNotification(@Body() dto: SendBulkNotificationDto) {
    return this.notificationService.sendBulk(dto);
  }

  // ─── Device Management ─────────────────────────────────────

  @Post('devices')
  @ApiOperation({ summary: 'Register a device for push notifications' })
  async registerDevice(
    @Req() req: any,
    @Body() dto: RegisterDeviceDto,
  ) {
    const accountId = BigInt(req.user.sub);
    return this.notificationService.registerDevice(accountId, dto);
  }

  @Delete('devices')
  @ApiOperation({ summary: 'Remove a device from push notifications' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeDevice(
    @Req() req: any,
    @Body() dto: RemoveDeviceDto,
  ) {
    const accountId = BigInt(req.user.sub);
    await this.notificationService.removeDevice(accountId, dto);
  }
}
