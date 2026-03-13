import { Review } from '../entity/review.entity';
import { ReviewResponseDto, ReviewerDto, ReviewOfficeDto, OfficeReviewsStatsDto } from '../dto/review-response.dto';

export class ReviewMapper {
  static toResponseDto(review: Review): ReviewResponseDto {
    const reviewer: ReviewerDto = {
      id: review.accountId,
      name: review.userProfile.name,
    };

    return {
      id: review.id,
      bookingId : review.bookingId ? review.bookingId : undefined,
      reviewer,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
    };
  }

  static toReviewsStatsDto(
    averageRating: number,
    totalReviews: number,
    ratingCounts: { rating: string; count: string }[],
  ): OfficeReviewsStatsDto {
    const ratingDistribution: Record<string, number> = {
      '1': 0,
      '2': 0,
      '3': 0,
      '4': 0,
      '5': 0,
    };

    ratingCounts.forEach((item) => {
      ratingDistribution[item.rating] = parseInt(item.count);
    });

    return {
      averageRating: parseFloat(averageRating.toFixed(2)),
      totalReviews,
      ratingDistribution,
    };
  }
}
