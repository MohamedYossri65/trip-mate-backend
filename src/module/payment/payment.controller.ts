import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import {
  InitiateSubscriptionPaymentDto,
  InitiateBookingPaymentDto,
} from './dto/initiate-payment.dto';
import { VerifyAndSaveCardDto, UpdateSavedCardDto } from './dto/verify-save-card.dto';
import {
  PayWithSavedCardDto,
  PaySubscriptionWithSavedCardDto,
} from './dto/payment-with-saved-card.dto';
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

  // ─── SAVED CARD ENDPOINTS ─────────────────────────────────────────

  @Post('cards/verify')
  @Auth()
  @ApiOperation({ summary: 'Verify and save a new card' })
  @SuccessResponse('Card verification initiated')
  async verifyAndSaveCard(
    @Body() dto: VerifyAndSaveCardDto,
    @CurrentUser() account: Account,
  ) {
    return this.paymentService.verifyAndSaveCard(
      account.id,
      dto.setAsDefault,
    );
  }

  @Get('cards')
  @Auth()
  @ApiOperation({ summary: 'Get all saved cards' })
  @SuccessResponse('Saved cards retrieved successfully')
  async getSavedCards(@CurrentUser() account: Account) {
    return this.paymentService.getSavedCards(account.id);
  }

  @Get('cards/:cardId')
  @Auth()
  @ApiOperation({ summary: 'Get a specific saved card' })
  @SuccessResponse('Saved card retrieved successfully')
  async getSavedCard(
    @Param('cardId') cardId: number,
    @CurrentUser() account: Account,
  ) {
    return this.paymentService.getSavedCard(account.id, cardId);
  }

  @Patch('cards/:cardId')
  @Auth()
  @ApiOperation({ summary: 'Update saved card (set default, activate/deactivate)' })
  @SuccessResponse('Saved card updated successfully')
  async updateSavedCard(
    @Param('cardId') cardId: number,
    @Body() dto: UpdateSavedCardDto,
    @CurrentUser() account: Account,
  ) {
    return this.paymentService.updateSavedCard(account.id, cardId, dto);
  }

  @Delete('cards/:cardId')
  @Auth()
  @ApiOperation({ summary: 'Delete a saved card' })
  @SuccessResponse('Saved card deleted successfully')
  async deleteSavedCard(
    @Param('cardId') cardId: number,
    @CurrentUser() account: Account,
  ) {
    await this.paymentService.deleteSavedCard(account.id, cardId);
    return { message: 'Card deleted successfully' };
  }

  // ─── PAY WITH SAVED CARD ──────────────────────────────────────────

  @Post('booking/saved-card')
  @Auth(RolesEnum.USER)
  @ApiOperation({ summary: 'Pay for booking using saved card' })
  @SuccessResponse('Payment processed successfully')
  async payBookingWithSavedCard(
    @Body() dto: PayWithSavedCardDto,
    @CurrentUser() account: Account,
  ) {
    return this.paymentService.payWithSavedCard({
      accountId: account.id,
      cardId: dto.cardId,
      bookingId: dto.bookingId,
      paymentType: dto.paymentType,
      couponCode: dto.couponCode,
    });
  }

  @Post('subscription/saved-card')
  @Auth(RolesEnum.OFFICE)
  @ApiOperation({ summary: 'Pay for subscription using saved card' })
  @SuccessResponse('Payment processed successfully')
  async paySubscriptionWithSavedCard(
    @Body() dto: PaySubscriptionWithSavedCardDto,
    @CurrentUser() account: Account,
  ) {
    return this.paymentService.paySubscriptionWithSavedCard(
      account.id,
      dto.cardId,
      dto.planId,
    );
  }
}
