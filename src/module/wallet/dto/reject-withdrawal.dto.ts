import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RejectWithdrawalDto {
  @ApiProperty({ description: 'Reason for rejecting the withdrawal request' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  reason: string;
}
