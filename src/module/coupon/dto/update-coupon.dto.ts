import { PartialType } from '@nestjs/swagger';
import { CreateCouponDto } from './create-coupon.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { CouponStatus } from '../enum/coupon-status.enum';

export class UpdateCouponDto extends PartialType(CreateCouponDto) {
  @ApiPropertyOptional({
    description: 'Toggle coupon status',
    enum: CouponStatus,
  })
  @IsOptional()
  @IsEnum(CouponStatus)
  status?: CouponStatus;
}
