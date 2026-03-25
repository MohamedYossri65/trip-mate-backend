import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RejectOfficeChangeRequestDto {
  @ApiProperty({ example: 'Please provide a valid tax certificate.' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
