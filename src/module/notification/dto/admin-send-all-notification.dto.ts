import { IsNotEmpty, IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationChannel } from '../enums';

export class AdminSendAllNotificationDto {
  @ApiProperty({ example: 'System maintenance' })
  @IsNotEmpty()
  @IsString()
  title!: string;

  @ApiProperty({ example: 'We will perform maintenance tonight at 2 AM.' })
  @IsNotEmpty()
  @IsString()
  body!: string;

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
