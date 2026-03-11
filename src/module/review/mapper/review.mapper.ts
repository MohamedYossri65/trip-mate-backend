import { Review } from '../entity/review.entity';
import { ReviewResponseDto, ReviewerDto, ReviewOfficeDto, OfficeReviewsStatsDto } from '../dto/review-response.dto';

export class ReviewMapper {
  static toResponseDto(review: Review): ReviewResponseDto {
    const reviewer: ReviewerDto = {
      id: review.accountId,
      name: review.userProfile.name,
    };

    const office: ReviewOfficeDto = {
      id: review.office.accountId,
      name: review.office.officeName,
      logo: review.office.logoUrl,
    };

    return {
      id: review.id,
      bookingId : review.bookingId ? review.bookingId : undefined,
      reviewer,
      office,
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
