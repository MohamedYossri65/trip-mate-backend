import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, Max, Min } from 'class-validator';

export class UpsertPaymentSettingDto {
  @ApiProperty({
    description: 'Application commission percentage',
    example: 12.5,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  appCommission: number;

  @ApiProperty({
    description: 'Tax percentage',
    example: 15,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  taxValue: number;

  @ApiProperty({
    description: 'Enable advance payment for new contracts',
    example: true,
  })
  @IsBoolean()
  enableNewContractAdvancePayment: boolean;

  @ApiProperty({
    description: 'Advance payment percentage of offer total',
    example: 25,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  advancePercentage: number;
}
