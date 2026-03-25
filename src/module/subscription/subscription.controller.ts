import { Controller, Post, Get, Body } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SubscriptionService } from './subscription.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { SubscribeOfficeDto } from './dto/subscribe-office.dto';
import { CurrentUser } from 'src/common/guards/decorators/user.decorator';
import { Account } from '../account/entity/account.entity';
import { RolesEnum } from 'src/common/enums/roles.enum';
import { SuccessResponse } from 'src/common/interceptors/success-response.interceptor';
import { Auth } from 'src/common/guards/decorators/auth.decorator';
import { Public } from 'src/common/guards/decorators/public.decorator';

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post('plans')
  @Auth(RolesEnum.ADMIN)
  @ApiOperation({ summary: 'Create a new subscription plan (Admin only)' })
  @SuccessResponse('Subscription plan created successfully')
  async createPlan(@Body() dto: CreatePlanDto) {
    return this.subscriptionService.createPlan(dto);
  }

  @Get('plans')
  @Public()
  @Auth()
  @ApiOperation({ summary: 'List all subscription plans' })
  @SuccessResponse('Subscription plans retrieved successfully')
  async getAllPlans() {
    return this.subscriptionService.getAllPlans();
  }

  @Post('subscribe')
  @Public()
  @Auth(RolesEnum.OFFICE)
  @ApiOperation({ summary: 'Subscribe office to a plan' })
  @SuccessResponse('Subscribed successfully')
  async subscribe(
    @Body() dto: SubscribeOfficeDto,
    @CurrentUser() account: Account,
  ) {
    return this.subscriptionService.subscribeToPlan(account.id, dto.planId);
  }

  @Post('cancel')
  @Public()
  @Auth(RolesEnum.OFFICE)
  @ApiOperation({ summary: 'Cancel current subscription' })
  @SuccessResponse('Subscription cancelled successfully')
  async cancelSubscription(@CurrentUser() account: Account) {
    return this.subscriptionService.cancelSubscription(account.id);
  }

  @Get('my-subscription')
  @Public()
  @Auth(RolesEnum.OFFICE)
  @ApiOperation({ summary: 'Get current office subscription' })
  @SuccessResponse('Subscription retrieved successfully')
  async getMySubscription(@CurrentUser() account: Account) {
    return this.subscriptionService.getActiveSubscription(account.id);
  }
}
