import { 
  Injectable, 
  BadRequestException, 
  NotFoundException,
  ForbiddenException 
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entity/review.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewFilterDto } from './dto/review-filter.dto';
import { ReviewMapper } from './mapper/review.mapper';
import { ReviewResponseDto, OfficeReviewsStatsDto } from './dto/review-response.dto';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { Booking } from '../bookings/domain/entity/booking.entity';
import { BookingStatus } from '../bookings/domain/enum/booking-status.enum';
import { OfficeProfile } from '../office/entity/office.entity';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,

    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,

    @InjectRepository(OfficeProfile)
    private readonly officeRepository: Repository<OfficeProfile>,
  ) {}

  async createReview(
    accountId: bigint,
    dto: CreateReviewDto,
  ): Promise<ReviewResponseDto> {
    // Verify office exists
    const office = await this.officeRepository.findOne({
      where: { accountId: dto.officeId },
    });

    if (!office) {
      throw new NotFoundException('Office not found');
    }

    // Verify user has completed at least one booking with this office
    const queryBuilder = this.bookingRepository
      .createQueryBuilder('booking')
      .andWhere('booking.userAccountId = :accountId', { accountId: BigInt(accountId) })
      .andWhere('booking.status = :status', { status: BookingStatus.COMPLETED });

    // If bookingId is provided, check that specific booking
    if (dto.bookingId) {
      queryBuilder.andWhere('booking.id = :bookingId', { bookingId: BigInt(dto.bookingId) });
    }
    const hasCompletedBooking = await queryBuilder.getOne();

    if (!hasCompletedBooking) {
      throw new BadRequestException(
        'You can only review offices after completing a booking with them',
      );
    }

    // Check if user already reviewed this office
    const existingReviewWhere: any = {
      accountId,
      officeId: dto.officeId,
    };

    // Only check for duplicate if bookingId is provided
    if (dto.bookingId) {
      existingReviewWhere.bookingId = dto.bookingId;
    }

    const existingReview = await this.reviewRepository.findOne({
      where: {
        accountId,
        officeId: dto.officeId,
        bookingId: dto.bookingId
      },
    });

    if (existingReview) {
      throw new BadRequestException(
        'You have already reviewed this office for this booking.',
      );
    }

    const review = this.reviewRepository.create({
      accountId,
      officeId: dto.officeId,
      bookingId: dto.bookingId,
      rating: dto.rating,
      comment: dto.comment,
    });

    const savedReview = await this.reviewRepository.save(review);

    // Fetch with relations for response
    const fullReview = await this.reviewRepository.findOne({
      where: { id: savedReview.id },
      relations: ['userProfile', 'office'],
    });

    if (!fullReview) {
      throw new NotFoundException('Review not found after creation');
    }

    return ReviewMapper.toResponseDto(fullReview);
  }

  async getOfficeReviews(
    officeId: bigint,
    dto: ReviewFilterDto,
  ): Promise<PaginatedResponseDto<ReviewResponseDto>> {
    const queryBuilder = this.reviewRepository
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.userProfile', 'userProfile')
      .leftJoinAndSelect('review.office', 'office')
      .where('review.officeId = :officeId', { officeId });

    if (dto.rating) {
      queryBuilder.andWhere('review.rating = :rating', { rating: dto.rating });
    }

    if (dto.minRating) {
      queryBuilder.andWhere('review.rating >= :minRating', {
        minRating: dto.minRating,
      });
    }

    queryBuilder
      .orderBy('review.createdAt', 'DESC')
      .skip((dto.page - 1) * dto.limit)
      .take(dto.limit);

    const [reviews, total] = await queryBuilder.getManyAndCount();

    const data = reviews.map((review) => ReviewMapper.toResponseDto(review));
    return new PaginatedResponseDto(data, total, dto.page, dto.limit);
  }

  async getOfficeReviewsStats(officeId: bigint): Promise<OfficeReviewsStatsDto> {
    const stats = await this.reviewRepository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'averageRating')
      .addSelect('COUNT(review.id)', 'totalReviews')
      .where('review.officeId = :officeId', { officeId })
      .getRawOne();

    const ratingCounts = await this.reviewRepository
      .createQueryBuilder('review')
      .select('review.rating', 'rating')
      .addSelect('COUNT(review.id)', 'count')
      .where('review.officeId = :officeId', { officeId })
      .groupBy('review.rating')
      .getRawMany();

    return ReviewMapper.toReviewsStatsDto(
      parseFloat(stats.averageRating) || 0,
      parseInt(stats.totalReviews) || 0,
      ratingCounts,
    );
  }

  async getMyReviews(
    accountId: bigint,
    dto: ReviewFilterDto,
  ): Promise<PaginatedResponseDto<ReviewResponseDto>> {
    const queryBuilder = this.reviewRepository
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.userProfile', 'userProfile')
      .leftJoinAndSelect('review.office', 'office')
      .where('review.accountId = :accountId', { accountId });

    if (dto.officeId) {
      queryBuilder.andWhere('review.officeId = :officeId', {
        officeId: dto.officeId,
      });
    }

    if (dto.rating) {
      queryBuilder.andWhere('review.rating = :rating', { rating: dto.rating });
    }

    queryBuilder
      .orderBy('review.createdAt', 'DESC')
      .skip((dto.page - 1) * dto.limit)
      .take(dto.limit);

    const [reviews, total] = await queryBuilder.getManyAndCount();

    const data = reviews.map((review) => ReviewMapper.toResponseDto(review));
    return new PaginatedResponseDto(data, total, dto.page, dto.limit);
  }

  async deleteReview(reviewId: bigint, accountId: bigint): Promise<void> {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.accountId !== accountId) {
      throw new ForbiddenException('You can only delete your own reviews');
    }

    await this.reviewRepository.remove(review);
  }

  async getReviewById(reviewId: bigint): Promise<ReviewResponseDto> {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId },
      relations: ['userProfile', 'office'],
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return ReviewMapper.toResponseDto(review);
  }

  async canUserReviewBooking(accountId: bigint ,bookingId: bigint): Promise<boolean> {
    const hasCompletedBooking = await this.bookingRepository
      .createQueryBuilder('booking')
      .andWhere('booking.userAccountId = :accountId', { accountId })
      .andWhere('booking.id = :bookingId', { bookingId })
      .andWhere('booking.status = :status', { status: BookingStatus.COMPLETED })
      .getOne();
    return !!hasCompletedBooking;
  }
}
