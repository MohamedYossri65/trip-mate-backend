import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationChannel } from '../enums';

export enum SingleNotificationTargetType {
  USER = 'USER',
  OFFICE = 'OFFICE',
}

export class AdminSendSingleNotificationDto {
  @ApiProperty({ enum: SingleNotificationTargetType })
  @IsEnum(SingleNotificationTargetType)
  targetType: SingleNotificationTargetType;

  @ApiPropertyOptional({
    description: 'Account ID when targetType is USER',
    example: '101',
  })
  @IsOptional()
  @IsString()
  targetAccountId?: string;

  @ApiPropertyOptional({
    description: 'Office owner account ID when targetType is OFFICE',
    example: '220',
  })
  @IsOptional()
  @IsString()
  targetOfficeAccountId?: string;

  @ApiProperty({ example: 'Booking update' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ example: 'Your booking has been approved.' })
  @IsNotEmpty()
  @IsString()
  body: string;

  @ApiPropertyOptional({ enum: NotificationChannel, default: NotificationChannel.PUSH })
  @IsOptional()
  @IsEnum(NotificationChannel)
  channel?: NotificationChannel;

  @ApiPropertyOptional({
    description: 'Optional metadata payload',
    example: { bookingId: 12345, source: 'admin-panel' },
  })
  @IsOptional()
  data?: Record<string, any>;
}
