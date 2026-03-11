import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewFilterDto } from './dto/review-filter.dto';
import { Auth } from 'src/common/guards/decorators/auth.decorator';
import { CurrentUser } from 'src/common/guards/decorators/user.decorator';
import { Account } from '../account/entity/account.entity';
import { RolesEnum } from 'src/common/enums/roles.enum';
import { SuccessResponse } from 'src/common/interceptors/success-response.interceptor';
import { Public } from 'src/common/guards/decorators/public.decorator';

@ApiTags('reviews')
@Controller({ path: 'reviews', version: '1' })
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  @Auth(RolesEnum.USER)
  @ApiOperation({ summary: 'Create a review for an office after completing a booking' })
  @SuccessResponse('Review created successfully')
  async createReview(
    @Body() dto: CreateReviewDto,
    @CurrentUser() account: Account,
  ) {
    return await this.reviewService.createReview(account.id, dto);
  }

  @Get('office/:officeId')
  @Public()
  @ApiOperation({ summary: 'Get all reviews for a specific office' })
  @ApiParam({ name: 'officeId', description: 'Office ID' })
  @SuccessResponse('Office reviews retrieved successfully')
  async getOfficeReviews(
    @Param('officeId') officeId: string,
    @Query() dto: ReviewFilterDto,
  ) {
    return await this.reviewService.getOfficeReviews(BigInt(officeId), dto);
  }

  @Get('office/:officeId/stats')
  @Public()
  @ApiOperation({ summary: 'Get review statistics for a specific office' })
  @ApiParam({ name: 'officeId', description: 'Office ID' })
  @SuccessResponse('Office review statistics retrieved successfully')
  async getOfficeReviewsStats(@Param('officeId') officeId: string) {
    return await this.reviewService.getOfficeReviewsStats(BigInt(officeId));
  }

  @Get('my')
  @Auth(RolesEnum.USER)
  @ApiOperation({ summary: 'Get current user reviews' })
  @SuccessResponse('User reviews retrieved successfully')
  async getMyReviews(
    @CurrentUser() account: Account,
    @Query() dto: ReviewFilterDto,
  ) {
    return await this.reviewService.getMyReviews(account.id, dto);
  }

  @Get(':reviewId')
  @Public()
  @ApiOperation({ summary: 'Get a specific review by ID' })
  @ApiParam({ name: 'reviewId', description: 'Review ID' })
  @SuccessResponse('Review retrieved successfully')
  async getReviewById(@Param('reviewId') reviewId: string) {
    return await this.reviewService.getReviewById(BigInt(reviewId));
  }


  @Delete(':reviewId')
  @Auth(RolesEnum.USER)
  @ApiOperation({ summary: 'Delete your own review' })
  @ApiParam({ name: 'reviewId', description: 'Review ID' })
  @SuccessResponse('Review deleted successfully')
  async deleteReview(
    @Param('reviewId') reviewId: string,
    @CurrentUser() account: Account,
  ) {
    await this.reviewService.deleteReview(BigInt(reviewId), account.id);
    return;
  }
}
