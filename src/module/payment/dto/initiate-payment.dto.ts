import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

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
}
