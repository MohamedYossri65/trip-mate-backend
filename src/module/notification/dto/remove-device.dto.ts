import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RemoveDeviceDto {
  @ApiProperty({ description: 'OneSignal Player ID / Subscription ID to remove' })
  @IsNotEmpty()
  @IsString()
  deviceToken: string;
}
