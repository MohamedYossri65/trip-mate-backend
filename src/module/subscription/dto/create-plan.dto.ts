import {
  IsString,
  IsNumber,
  IsInt,
  Min,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { PlanFeatureDto } from './plan-feature.dto';

export class CreatePlanDto {
  @ApiProperty({ example: 'Basic' })
  @IsString()
  name: string;

  @ApiProperty({ example: 50 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 30 })
  @IsInt()
  @Min(1)
  durationInDays: number;

  @ApiProperty({ type: [PlanFeatureDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlanFeatureDto)
  features: PlanFeatureDto[];
}
