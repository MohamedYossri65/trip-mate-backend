import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubscribeOfficeDto {
  @ApiProperty({ example: 1, description: 'ID of the subscription plan' })
  @IsNotEmpty()
  planId: number;
}
