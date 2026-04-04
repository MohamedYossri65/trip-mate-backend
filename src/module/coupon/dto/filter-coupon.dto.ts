import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';
import { CouponTarget } from '../enum/coupon-target.enum';
import { CouponStatus } from '../enum/coupon-status.enum';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class FilterCouponDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search by coupon name or code' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by target audience',
    enum: CouponTarget,
  })
  @IsOptional()
  @IsEnum(CouponTarget)
  target?: CouponTarget;

  @ApiPropertyOptional({
    description: 'Filter by coupon status',
    enum: CouponStatus,
  })
  @IsOptional()
  @IsEnum(CouponStatus)
  status?: CouponStatus;

  @ApiPropertyOptional({ description: 'Filter coupons starting from this date' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter coupons ending before this date' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
