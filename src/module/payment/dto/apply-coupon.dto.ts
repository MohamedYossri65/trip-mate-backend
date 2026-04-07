import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, Min } from 'class-validator';

export class ApplyCouponDto {
  @ApiProperty({
    description: 'Coupon code to apply',
    example: 'TRIP-ABC123',
  })
  @IsString()
  couponCode: string;

  @ApiProperty({
    description: 'Offer ID where coupon is being applied',
    example: 101,
  })
  @IsNumber()
  @Min(1)
  offerId: number;
}
