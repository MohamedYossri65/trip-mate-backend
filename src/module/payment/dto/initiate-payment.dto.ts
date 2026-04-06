import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class InitiateSubscriptionPaymentDto {
  @ApiProperty({ description: 'Subscription plan ID to pay for' })
  @IsNotEmpty()
  @IsNumber()
  planId: number;
}

export class InitiateOfferPaymentDto {
  @ApiProperty({ description: 'Offer ID to pay for' })
  @IsNotEmpty()
  @IsNumber()
  offerId: number;

  @ApiPropertyOptional({ description: 'Coupon code to apply for a discount' })
  @IsOptional()
  @IsString()
  couponCode?: string;
}
