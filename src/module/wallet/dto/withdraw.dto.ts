import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class WithdrawDto {
  @ApiProperty({ description: 'Amount to withdraw from available balance' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({ description: 'Optional tax invoice attachment for the withdrawal request' })
  @IsOptional()
  @IsString()
  taxInvoiceAttachment?: string;

  @ApiPropertyOptional({ description: 'Optional notes for the withdrawal request' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
