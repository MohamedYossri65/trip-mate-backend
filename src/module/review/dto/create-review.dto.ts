import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateReviewDto {
  @ApiProperty({
    description: 'Office ID to review',
    example: 1,
  })
  @IsNotEmpty()
  @Transform(({ value }) => BigInt(value))
  officeId: bigint;

  @ApiProperty({
    description: 'Booking ID associated with the review',
    example: 1,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value ? BigInt(value) : undefined))
  bookingId?: bigint;

  @ApiProperty({
    description: 'Rating from 1 to 5',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({
    description: 'Review comment',
    example: 'Great service! Highly recommended.',
    required: false,
  })
  @IsOptional()
  @IsString()
  comment?: string;
}
