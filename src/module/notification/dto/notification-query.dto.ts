import { IsOptional, IsInt, Min, Max, IsEnum, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { NotificationSource } from '../enums/notification-source';

export class NotificationQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search in title and body' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by source' })
  @IsOptional()
  @IsEnum(NotificationSource)
  source?: NotificationSource;

  @ApiPropertyOptional({ description: 'Filter by start date' })
  @IsOptional()
  @Type(() => Date)
  fromDate?: Date;

  @ApiPropertyOptional({ description: 'Filter by end date' })
  @IsOptional()
  @Type(() => Date)
  toDate?: Date;
}
