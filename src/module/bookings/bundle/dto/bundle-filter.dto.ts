import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { SortDto } from 'src/common/dto/sort.dto';

export class BundleFilterDto extends PaginationDto implements SortDto {
  @ApiPropertyOptional({ description: 'Filter by booking status of all sub-bookings' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Filter by arrival country of all sub-bookings' })
  @IsOptional()
  @IsString()
  arrivalCountry?: string;

  @ApiPropertyOptional({ enum: ['createdAt'] })
  @IsOptional()
  @IsString()
  sortBy?: 'createdAt';

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'] })
  @IsOptional()
  sortOrder: 'ASC' | 'DESC' = 'DESC';
}
