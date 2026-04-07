import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpsertOfficePaymentDetailsDto {
  @ApiProperty({ description: 'Office bank name' })
  @IsString()
  @IsNotEmpty()
  bankName!: string;

  @ApiProperty({ description: 'Office bank account number' })
  @IsString()
  @IsNotEmpty()
  bankAccountNumber!: string;

  @ApiProperty({ description: 'Office IBAN number' })
  @IsString()
  @IsNotEmpty()
  ibanNumber!: string;

  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  @IsOptional()
  ibanAttachment?: any;
}
