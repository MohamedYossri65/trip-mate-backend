import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpsertBookingSettingDto {
  @ApiProperty({ description: 'Whether the service is enabled', example: true })
  @IsBoolean()
  @IsNotEmpty()
  isEnabled: boolean;
}
