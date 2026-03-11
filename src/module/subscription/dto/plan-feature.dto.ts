import { IsEnum, IsBoolean, IsOptional, IsInt, Min, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FeatureCode } from '../enum/feature-code.enum';

export class PlanFeatureDto {
  @ApiProperty({ enum: FeatureCode, example: FeatureCode.SEND_OFFERS })
  @IsEnum(FeatureCode)
  featureCode: FeatureCode;

  @ApiProperty({ example: true })
  @IsBoolean()
  enabled: boolean;

  @ApiPropertyOptional({ example: 'Custom feature name for display purposes' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 5, description: 'Limit value for limited features (e.g. max employees)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  limitValue?: number;
}
