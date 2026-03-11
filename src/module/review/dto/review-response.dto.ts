import { ApiProperty } from '@nestjs/swagger';

export class ReviewerDto {
    @ApiProperty({ example: 1 })
    id: bigint;

    @ApiProperty({ example: 'John Doe' })
    name: string;
}

export class ReviewOfficeDto {
    @ApiProperty({ example: 1 })
    id: bigint;

    @ApiProperty({ example: 'Travel Agency XYZ' })
    name: string;

    @ApiProperty({ example: 'https://example.com/logo.jpg', required: false })
    logo?: string;
}

export class ReviewResponseDto {
    @ApiProperty({ example: 1 })
    id: bigint;

    @ApiProperty({ example: 1, required: false })
    bookingId?: bigint;

    @ApiProperty({ type: ReviewerDto })
    reviewer: ReviewerDto;

    @ApiProperty({ type: ReviewOfficeDto })
    office: ReviewOfficeDto;

    @ApiProperty({ example: 5 })
    rating: number;

    @ApiProperty({ example: 'Great service!', required: false })
    comment?: string;

    @ApiProperty({ example: '2026-03-11T10:00:00.000Z' })
    createdAt: Date;
}

export class OfficeReviewsStatsDto {
    @ApiProperty({ example: 4.5 })
    averageRating: number;

    @ApiProperty({ example: 120 })
    totalReviews: number;

    @ApiProperty({
        example: { '5': 80, '4': 30, '3': 8, '2': 1, '1': 1 },
        description: 'Count of reviews by rating'
    })
    ratingDistribution: Record<string, number>;
}
