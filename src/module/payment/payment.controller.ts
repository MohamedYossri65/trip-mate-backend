import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Req,
  Query,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import {
  InitiateSubscriptionPaymentDto,
  InitiateOfferPaymentDto,
} from './dto/initiate-payment.dto';
import { VerifyAndSaveCardDto, UpdateSavedCardDto } from './dto/verify-save-card.dto';
import {
  PayWithSavedOfferCardDto,
  PaySubscriptionWithSavedCardDto,
} from './dto/payment-with-saved-card.dto';
import { UpsertPaymentSettingDto } from './dto/upsert-payment-setting.dto';
import { Auth } from 'src/common/guards/decorators/auth.decorator';
import { CurrentUser } from 'src/common/guards/decorators/user.decorator';
import { Account } from '../account/entity/account.entity';
import { RolesEnum } from 'src/common/enums/roles.enum';
import { SuccessResponse } from 'src/common/interceptors/success-response.interceptor';
import { Public } from 'src/common/guards/decorators/public.decorator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@ApiTags('payments')
@Controller({ path: 'payments', version: '1' })
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  // ─── PAYMENT SETTINGS ────────────────────────────────────────────

  @Post('settings')
  @Auth(RolesEnum.ADMIN)
  @ApiOperation({ summary: 'Create or update payment settings (Admin only)' })
  @SuccessResponse('Payment settings saved successfully')
  async upsertPaymentSettings(@Body() dto: UpsertPaymentSettingDto) {
    return this.paymentService.upsertPaymentSettings(dto);
  }

  @Get('settings')
  @ApiOperation({ summary: 'Get payment settings' })
  @SuccessResponse('Payment settings retrieved successfully')
  async getPaymentSettings() {
    return this.paymentService.getPaymentSettings();
  }

  @Get('offer-summary/:offerId')
  @Auth()
  @ApiQuery({ name: 'couponCode', required: false, type: 'string' })
  @ApiOperation({ summary: 'Get offer payment summary' })
  @SuccessResponse('Offer payment summary retrieved successfully')
  async getOfferPaymentSummary(
    @Param('offerId') offerId: string,
    @Query('couponCode') couponCode: string | undefined,
    @CurrentUser() account: Account,
  ) {
    return this.paymentService.getOfferPartialPaymentSummary(
      account.id,
      BigInt(offerId),
      couponCode,
    );
  }

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

  // ─── Booking Partial Payment (settings %) ─────────────────────────

  @Post('offer/partial')
  @Auth(RolesEnum.USER)
  @ApiOperation({
    summary: 'Initiate partial offer payment via Tap (percentage from payment settings)',
  })
  @SuccessResponse('Payment page created successfully')
  async initiateOfferPartialPayment(
    @Body() dto: InitiateOfferPaymentDto,
    @CurrentUser() account: Account,
  ) {
    return this.paymentService.initiateOfferPartialPayment(
      account.id,
      dto.offerId,
      dto.couponCode,
    );
  }

  // ─── Offer Full Payment (remaining 75%) ──────────────────────────

  @Post('offer/full')
  @Auth(RolesEnum.USER)
  @ApiOperation({
    summary: 'Initiate full offer payment (remaining 75%) via Tap',
  })
  @SuccessResponse('Payment page created successfully')
  async initiateOfferFullPayment(
    @Body() dto: InitiateOfferPaymentDto,
    @CurrentUser() account: Account,
  ) {
    return this.paymentService.initiateOfferFullPayment(
      account.id,
      dto.offerId,
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

  @Get('redirect')
  @Public()
  @Header('Content-Type', 'text/html; charset=utf-8')
  @ApiOperation({ summary: 'Verify Tap redirect and render payment result HTML' })
  async paymentRedirect(@Req() req: any) {
    const transactionRef =
      req?.query?.transactionRef ||
      req?.query?.chargeId ||
      req?.query?.tap_id ||
      req?.query?.id ||
      req?.query?.tapId;

    return this.paymentService.renderPaymentRedirectPage(transactionRef);
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
  async getMyPayments(@Query() pagination: PaginationDto, @CurrentUser() account: Account) {
    return this.paymentService.getPaymentsByAccountPaginated(account.id, pagination);
  }

  @Get('payment-history/:accountId')
  @Auth()
  @ApiQuery({ name: 'paymentId', required: false, type: 'string' })
  @ApiOperation({ summary: 'Get payment history for a specific account' })
  @SuccessResponse('Payment history retrieved successfully')
  async getPaymentHistory(
    @Param('accountId') accountId: string,
    @Query('paymentId') paymentId: string | undefined,
    @Query() pagination: PaginationDto
  ) {
    return this.paymentService.getUserPaymentHistory(
      BigInt(accountId),
      paymentId ? BigInt(paymentId) : undefined,
      pagination
    );
  }
}