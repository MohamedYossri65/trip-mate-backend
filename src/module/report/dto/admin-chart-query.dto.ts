import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, Min } from 'class-validator';

export class AdminChartQueryDto {
  @ApiPropertyOptional({
    description: 'Start date (inclusive) in ISO format, e.g. 2026-03-01',
    example: '2026-03-01',
  })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({
    description: 'End date (inclusive) in ISO format, e.g. 2026-03-31',
    example: '2026-03-31',
  })
  @IsOptional()
  @IsDateString()
  toDate?: string;
}
