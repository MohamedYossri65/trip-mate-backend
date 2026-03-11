import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class ReviewFilterDto extends PaginationDto {
  @ApiProperty({
    description: 'Filter by office ID',
    example: 1,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value ? BigInt(value) : undefined))
  officeId?: bigint;

  @ApiProperty({
    description: 'Filter by minimum rating',
    example: 3,
    minimum: 1,
    maximum: 5,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5)
  minRating?: number;

  @ApiProperty({
    description: 'Filter by exact rating',
    example: 5,
    minimum: 1,
    maximum: 5,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;
}
