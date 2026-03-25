import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DeviceType } from '../enums';

export class RegisterDeviceDto {
  @ApiProperty({ description: 'OneSignal Player ID / Subscription ID' })
  @IsNotEmpty()
  @IsString()
  deviceToken: string;

  @ApiProperty({ enum: DeviceType })
  @IsNotEmpty()
  @IsEnum(DeviceType)
  deviceType: DeviceType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  appVersion?: string;
}
