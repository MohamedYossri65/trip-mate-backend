import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import {
  InitiateSubscriptionPaymentDto,
  InitiateBookingPaymentDto,
} from './dto/initiate-payment.dto';
import { Auth } from 'src/common/guards/decorators/auth.decorator';
import { CurrentUser } from 'src/common/guards/decorators/user.decorator';
import { Account } from '../account/entity/account.entity';
import { RolesEnum } from 'src/common/enums/roles.enum';
import { SuccessResponse } from 'src/common/interceptors/success-response.interceptor';
import { Public } from 'src/common/guards/decorators/public.decorator';

@ApiTags('payments')
@Controller({ path: 'payments', version: '1' })
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  // ─── Subscription Payment ─────────────────────────────────────────

  @Post('subscription')
  @Public()
  @Auth(RolesEnum.OFFICE)
  @ApiOperation({ summary: 'Initiate subscription payment via Tap' })
  @SuccessResponse('Payment page created successfully')
  async initiateSubscriptionPayment(
    @Body() dto: InitiateSubscriptionPaymentDto,
    @CurrentUser() account: Account,
  ) {
    return this.paymentService.initiateSubscriptionPayment(
      account.id,
      dto.planId,
    );
  }

  // ─── Booking Partial Payment (25%) ────────────────────────────────

  @Post('booking/partial')
  @Auth(RolesEnum.USER)
  @ApiOperation({
    summary: 'Initiate partial booking payment (25%) via Tap',
  })
  @SuccessResponse('Payment page created successfully')
  async initiateBookingPartialPayment(
    @Body() dto: InitiateBookingPaymentDto,
    @CurrentUser() account: Account,
  ) {
    return this.paymentService.initiateBookingPartialPayment(
      account.id,
      dto.bookingId,
      dto.couponCode,
    );
  }

  // ─── Booking Full Payment (remaining 75%) ─────────────────────────

  @Post('booking/full')
  @Auth(RolesEnum.USER)
  @ApiOperation({
    summary: 'Initiate full booking payment (remaining 75%) via Tap',
  })
  @SuccessResponse('Payment page created successfully')
  async initiateBookingFullPayment(
    @Body() dto: InitiateBookingPaymentDto,
    @CurrentUser() account: Account,
  ) {
    return this.paymentService.initiateBookingFullPayment(
      account.id,
      dto.bookingId,
      dto.couponCode,
    );
  }

  // ─── Tap Webhook (server-to-server, no auth) ──────────────────────

  @Post('webhook')
  @Public()
  @ApiOperation({ summary: 'Tap payment webhook (server-to-server)' })
  async handleWebhook(@Req() req: any) {
    await this.paymentService.handleWebhook(req.body);
    return { status: 'received' };
  }

  // ─── Verify Payment ───────────────────────────────────────────────

  @Get('verify/:transactionRef')
  @Auth()
  @ApiOperation({ summary: 'Verify payment status with Tap' })
  @SuccessResponse('Payment verification completed')
  async verifyPayment(@Param('transactionRef') transactionRef: string) {
    return this.paymentService.retrieveCharge(transactionRef);
  }

  // ─── Get User Payment History ─────────────────────────────────────

  @Get('my')
  @Auth()
  @ApiOperation({ summary: 'Get all payments for current user' })
  @SuccessResponse('Payments retrieved successfully')
  async getMyPayments(@CurrentUser() account: Account) {
    return this.paymentService.getPaymentsByAccount(account.id);
  }
}
