import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationChannel } from '../enums';

export class SendBulkNotificationDto {
  @ApiProperty({ description: 'Template key to use', example: 'TRIP_BOOKED' })
  @IsNotEmpty()
  @IsString()
  templateKey: string;

  @ApiPropertyOptional({
    description:
      'List of account IDs to send to. If empty and no segment provided, sends to ALL users.',
    type: [String],
    example: ['1', '2', '3'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  accountIds?: string[];

  @ApiPropertyOptional({
    description:
      'OneSignal segment name for mass push (e.g. "Subscribed Users", "Active Users"). Skips per-user DB rendering and sends directly via OneSignal.',
    example: 'Subscribed Users',
  })
  @IsOptional()
  @IsString()
  segment?: string;

  @ApiPropertyOptional({
    description: 'Template variables to inject',
    example: { country: 'Saudi Arabia' },
  })
  @IsOptional()
  data?: Record<string, any>;

  @ApiPropertyOptional({
    enum: NotificationChannel,
    default: NotificationChannel.PUSH,
  })
  @IsOptional()
  @IsEnum(NotificationChannel)
  channel?: NotificationChannel;
}
