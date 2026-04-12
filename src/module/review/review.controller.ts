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
  constructor(private readonly reviewService: ReviewService) { }

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

  @Patch(':reviewId')
  @Auth(RolesEnum.USER, RolesEnum.ADMIN)
  @ApiOperation({ summary: 'Edit a review (owner or admin)' })
  @ApiParam({ name: 'reviewId', description: 'Review ID' })
  @SuccessResponse('Review updated successfully')
  async updateReview(
    @Param('reviewId') reviewId: string,
    @Body() dto: UpdateReviewDto,
    @CurrentUser() account: Account,
  ) {
    return await this.reviewService.updateReview(BigInt(reviewId), account, dto);
  }

  @Get()
  @Auth(RolesEnum.ADMIN)
  @ApiOperation({ summary: 'Get all reviews for a specific office' })
  @SuccessResponse('Office reviews retrieved successfully')
  async getAllReviews(
    @Query() dto: ReviewFilterDto,
  ) {
    return await this.reviewService.getAllReviews(dto);
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

  @Get('office/:officeId/management')
  @Auth(RolesEnum.OFFICE, RolesEnum.ADMIN)
  @ApiOperation({ summary: 'Get all reviews for a specific office including hidden (Office/Admin)' })
  @ApiParam({ name: 'officeId', description: 'Office ID' })
  @SuccessResponse('Office reviews retrieved successfully')
  async getOfficeReviewsForManagement(
    @Param('officeId') officeId: string,
    @Query() dto: ReviewFilterDto,
    @CurrentUser() account: Account,
  ) {
    return await this.reviewService.getOfficeReviewsForManagement(
      account,
      BigInt(officeId),
      dto,
    );
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

  @Post('toggle-hide/:reviewId')
  @Auth(RolesEnum.OFFICE, RolesEnum.ADMIN)
  @ApiOperation({ summary: 'Toggle hide status of a specific review (Office/Admin)' })
  @ApiParam({ name: 'reviewId', description: 'Review ID' })
  @SuccessResponse('Review hide status toggled successfully')
  async toggleHideReview(
    @Param('reviewId') reviewId: string,
  ) {
    await this.reviewService.toggleHideReview(BigInt(reviewId));
    return;
  }

  @Get(':reviewId')
  @Public()
  @ApiOperation({ summary: 'Get a specific review by ID' })
  @ApiParam({ name: 'reviewId', description: 'Review ID' })
  @SuccessResponse('Review retrieved successfully')
  async getReviewById(@Param('reviewId') reviewId: string) {
    return await this.reviewService.getReviewById(BigInt(reviewId));
  }


  @Get(':reviewId/management')
  @Auth(RolesEnum.OFFICE, RolesEnum.ADMIN)
  @ApiOperation({ summary: 'Get specific review by ID including hidden (Office/Admin)' })
  @ApiParam({ name: 'reviewId', description: 'Review ID' })
  @SuccessResponse('Review retrieved successfully')
  async getReviewByIdForManagement(
    @Param('reviewId') reviewId: string,
    @CurrentUser() account: Account,
  ) {
    return await this.reviewService.getReviewByIdForManagement(
      BigInt(reviewId),
      account,
    );
  }


  @Delete(':reviewId')
  @Auth(RolesEnum.USER ,RolesEnum.ADMIN)
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
