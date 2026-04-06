import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class VerifyAndSaveCardDto {
  @ApiPropertyOptional({
    description: 'Set this card as default payment method',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  setAsDefault?: boolean;
}

export class UpdateSavedCardDto {
  @ApiPropertyOptional({
    description: 'Set as default payment method',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({
    description: 'Activate or deactivate the card',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
