import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateReviewDto {
  @ApiProperty({
    description: 'Rating from 1 to 5',
    example: 5,
    minimum: 1,
    maximum: 5,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiProperty({
    description: 'Review comment',
    example: 'Updated review comment.',
    required: false,
  })
  @IsOptional()
  @IsString()
  comment?: string;
}
