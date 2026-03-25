import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationChannel } from '../enums';

export enum BulkNotificationTargetType {
  USERS = 'USERS',
  OFFICES = 'OFFICES',
  ALL = 'ALL',
}

export class AdminSendBulkNotificationDto {
  @ApiProperty({ enum: BulkNotificationTargetType })
  @IsEnum(BulkNotificationTargetType)
  targetType: BulkNotificationTargetType;

  @ApiPropertyOptional({
    description: 'Used when targetType is USERS',
    type: [String],
    example: ['1', '2', '3'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetAccountIds?: string[];

  @ApiPropertyOptional({
    description: 'Office owner account IDs when targetType is OFFICES',
    type: [String],
    example: ['220', '221'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetOfficeAccountIds?: string[];

  @ApiProperty({ example: 'System maintenance' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ example: 'We will perform maintenance tonight at 2 AM.' })
  @IsNotEmpty()
  @IsString()
  body: string;

  @ApiPropertyOptional({ enum: NotificationChannel, default: NotificationChannel.PUSH })
  @IsOptional()
  @IsEnum(NotificationChannel)
  channel?: NotificationChannel;

  @ApiPropertyOptional({
    description: 'Optional metadata payload',
    example: { source: 'admin-panel' },
  })
  @IsOptional()
  data?: Record<string, any>;
}
