import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class PayWithSavedCardDto {
  @ApiProperty({
    description: 'Saved card ID',
    example: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  cardId: number;

  @ApiProperty({
    description: 'Booking ID',
    example: 123,
  })
  @IsNotEmpty()
  @IsNumber()
  bookingId: number;

  @ApiProperty({
    description: 'Payment type: PARTIAL or FULL',
    example: 'PARTIAL',
  })
  @IsNotEmpty()
  @IsString()
  paymentType: 'PARTIAL' | 'FULL';

  @ApiPropertyOptional({
    description: 'Coupon code for discount',
    example: 'SUMMER2024',
  })
  @IsOptional()
  @IsString()
  couponCode?: string;
}

export class PaySubscriptionWithSavedCardDto {
  @ApiProperty({
    description: 'Saved card ID',
    example: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  cardId: number;

  @ApiProperty({
    description: 'Subscription plan ID',
    example: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  planId: number;
}
