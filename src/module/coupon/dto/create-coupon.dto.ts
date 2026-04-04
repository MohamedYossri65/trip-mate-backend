import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsDateString,
  Min,
} from 'class-validator';
import { CouponTarget } from '../enum/coupon-target.enum';
import { DiscountType } from '../enum/discount-type.enum';

export class CreateCouponDto {
  @ApiProperty({ description: 'Display name of the coupon' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Who can use this coupon',
    enum: CouponTarget,
  })
  @IsNotEmpty()
  @IsEnum(CouponTarget)
  target: CouponTarget;

  @ApiProperty({ description: 'Maximum number of times coupon can be used' })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  maxUsageCount: number;

  @ApiProperty({ description: 'Coupon validity start date (ISO 8601)' })
  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'Coupon validity end date (ISO 8601)' })
  @IsNotEmpty()
  @IsDateString()
  endDate: string;

  @ApiProperty({
    description: 'Type of discount',
    enum: DiscountType,
  })
  @IsNotEmpty()
  @IsEnum(DiscountType)
  discountType: DiscountType;

  @ApiProperty({ description: 'Discount value (percentage 0-100 or fixed amount)' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0.01)
  discountValue: number;
}
