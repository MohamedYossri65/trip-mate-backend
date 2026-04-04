import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class InitiateSubscriptionPaymentDto {
  @ApiProperty({ description: 'Subscription plan ID to pay for' })
  @IsNotEmpty()
  @IsNumber()
  planId: number;
}

export class InitiateBookingPaymentDto {
  @ApiProperty({ description: 'Booking ID to pay for' })
  @IsNotEmpty()
  @IsNumber()
  bookingId: number;

  @ApiPropertyOptional({ description: 'Coupon code to apply for a discount' })
  @IsOptional()
  @IsString()
  couponCode?: string;
}
