import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { PaymentTransaction } from './entity/payment-transaction.entity';
import { PaymentSetting } from './entity/payment-setting.entity';
import { PaymentType } from './enum/payment-type.enum';
import { PaymentStatus } from './enum/payment-status.enum';
import { SubscriptionService } from '../subscription/subscription.service';
import { Offer } from '../offers/entity/offer.entity';
import { OfferStatus } from '../offers/enum/offer-status.enum';
import { Booking } from '../bookings/domain/entity/booking.entity';
import { BookingStatus } from '../bookings/domain/enum/booking-status.enum';
import { SubscriptionPlan } from '../subscription/entity/subscription-plan.entity';
import { Account } from '../account/entity/account.entity';
import { WalletService } from '../wallet/wallet.service';
import { CouponService } from '../coupon/coupon.service';
import { UpsertPaymentSettingDto } from './dto/upsert-payment-setting.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  private readonly secretKey: string;
  private readonly currency: string;
  private readonly webhookUrl: string;
  private readonly redirectUrl: string;
  private readonly baseUrl = 'https://api.tap.company/v2';

  constructor(
    @InjectRepository(PaymentTransaction)
    private readonly paymentRepo: Repository<PaymentTransaction>,

    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,

    @InjectRepository(Offer)
    private readonly offerRepo: Repository<Offer>,

    @InjectRepository(SubscriptionPlan)
    private readonly planRepo: Repository<SubscriptionPlan>,

    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,

    @InjectRepository(PaymentSetting)
    private readonly paymentSettingRepo: Repository<PaymentSetting>,

    private readonly subscriptionService: SubscriptionService,
    private readonly configService: ConfigService,
    private readonly walletService: WalletService,
    private readonly couponService: CouponService,
  ) {
    this.secretKey = this.configService.get<string>('TAP_SECRET_KEY', '');
    this.currency = this.configService.get<string>('TAP_CURRENCY', 'SAR');
    this.webhookUrl = this.configService.get<string>('TAP_WEBHOOK_URL', '');
    this.redirectUrl = this.configService.get<string>('TAP_REDIRECT_URL', '');
  }

  async upsertPaymentSettings(
    dto: UpsertPaymentSettingDto,
  ): Promise<PaymentSetting> {
    const settings = await this.paymentSettingRepo.findOne({
      where: {},
      order: { id: 'ASC' },
    });

    if (!settings) {
      const created = this.paymentSettingRepo.create(dto);
      return this.paymentSettingRepo.save(created);
    }

    Object.assign(settings, dto);
    return this.paymentSettingRepo.save(settings);
  }

  async getPaymentSettings(): Promise<PaymentSetting> {
    const settings = await this.paymentSettingRepo.findOne({
      where: {},
      order: { id: 'ASC' },
    });

    if (settings) {
      return settings;
    }

    const defaultSettings = this.paymentSettingRepo.create({
      appCommission: 0,
      taxValue: 0,
      enableNewContractAdvancePayment: false,
      advancePercentage: 0,
    });

    return this.paymentSettingRepo.save(defaultSettings);
  }

  async getOfferPartialPaymentSummary(
    accountId: bigint,
    offerId: bigint,
    couponCode?: string,
  ): Promise<{
    offerId: number;
    bookingId: number;
    offerPrice: number;
    appCommissionRate: number;
    appCommissionAmount: number;
    taxRate: number;
    taxAmount: number;
    advancePercentage: number;
    advanceAmount: number;
    amountBeforeCoupon: number;
    couponCode: string | null;
    discountAmount: number;
    amountAfterCoupon: number;
    currency: string;
    partialPaymentEnabled: boolean;
    officeId: number;
  }> {
    const { offer, booking } = await this.resolveOfferPaymentContext(
      accountId,
      Number(offerId),
    );

    const settings = await this.getPaymentSettings();
    const offerPrice = Number(offer.price);
    const appCommissionRate = Number(settings.appCommission || 0);
    const taxRate = Number(settings.taxValue || 0);
    const advancePercentage = Number(settings.advancePercentage || 0);

    const advanceAmount = Math.round(((offerPrice * advancePercentage) / 100) * 100) / 100;
    const appCommissionAmount = Math.round(((offerPrice * appCommissionRate) / 100) * 100) / 100;
    const taxAmount = Math.round(((offerPrice * taxRate) / 100) * 100) / 100;

    const amountBeforeCoupon = Math.round((advanceAmount + appCommissionAmount + taxAmount) * 100) / 100;

    let discountAmount = 0;
    let amountAfterCoupon = amountBeforeCoupon;

    if (couponCode) {
      const preview = await this.couponService.validate(
        couponCode,
        accountId,
        BigInt(booking.id),
        amountBeforeCoupon,
      );
      discountAmount = preview.discountAmount;
      amountAfterCoupon = preview.finalAmount;
    }

    return {
      offerId: Number(offerId),
      bookingId: Number(booking.id),
      offerPrice,
      officeId: Number(offer.office.accountId),
      appCommissionRate,
      appCommissionAmount,
      taxRate,
      taxAmount,
      advancePercentage,
      advanceAmount,
      amountBeforeCoupon,
      couponCode: couponCode ?? null,
      discountAmount,
      amountAfterCoupon,
      currency: this.currency,
      partialPaymentEnabled: settings.enableNewContractAdvancePayment,
    };
  }
  

  // ─── SUBSCRIPTION PAYMENT ──────────────────────────────────────────

  async initiateSubscriptionPayment(
    accountId: bigint,
    planId: number,
  ): Promise<{ redirectUrl: string; transactionId: bigint; chargeId: string }> {
    const plan = await this.planRepo.findOne({
      where: { id: BigInt(planId) },
    });
    if (!plan) throw new NotFoundException('Subscription plan not found');

    const account = await this.accountRepo.findOne({
      where: { id: accountId },
    });
    if (!account) throw new NotFoundException('Account not found');

    const cartId = `SUB-${accountId}-${planId}-${Date.now()}`;

    // Create pending payment record
    const payment = this.paymentRepo.create({
      cartId,
      type: PaymentType.SUBSCRIPTION,
      status: PaymentStatus.PENDING,
      amount: plan.price,
      currency: this.currency,
      payerAccount: account,
      subscriptionPlan: plan,
    });
    const savedPayment = await this.paymentRepo.save(payment);

    // Create Tap charge
    const tapResponse = await this.createCharge({
      cartId,
      description: `Subscription: ${plan.name}`,
      amount: plan.price,
      customerName: account.email || account.phone || 'Customer',
      customerEmail: account.email || 'no-email@tripmate.com',
      customerPhone: account.phone || '0500000000',
    });

    // Update payment with charge ID
    savedPayment.transactionReference = tapResponse.id;
    savedPayment.gatewayResponse = tapResponse;
    await this.paymentRepo.save(savedPayment);

    this.logger.log(
      `Subscription payment initiated: cartId=${cartId}, chargeId=${tapResponse.id}`,
    );

    return {
      redirectUrl: tapResponse.transaction.url,
      transactionId: savedPayment.id,
      chargeId: tapResponse.id,
    };
  }

  // ─── BOOKING PARTIAL PAYMENT (settings %) ─────────────────────────

  async initiateOfferPartialPayment(
    accountId: bigint,
    offerId: number,
    couponCode?: string,
  ): Promise<{ redirectUrl: string; transactionId: bigint; chargeId: string; discountAmount?: number }> {
    const { offer, booking, account } = await this.resolveOfferPaymentContext(accountId, offerId);

    if(offer.status === OfferStatus.ACCEPTED) {
      throw new BadRequestException('Offer already accepted, cannot initiate partial payment');
    }

    const offerPartialSummary = await this.getOfferPartialPaymentSummary(accountId, BigInt(offerId), couponCode);

    const cartId = `OF-PARTIAL-${offerId}-${Date.now()}`;

    const payment = this.paymentRepo.create({
      cartId,
      type: PaymentType.BOOKING_PARTIAL,
      status: PaymentStatus.PENDING,
      amount: offerPartialSummary.amountAfterCoupon,
      advanceAmount: offerPartialSummary.advanceAmount,
      appCommissionAmount: offerPartialSummary.appCommissionAmount,
      currency: this.currency,
      payerAccount: account,
      booking,
      ...(couponCode ? { couponCode, discountAmount: offerPartialSummary.discountAmount } : {}),
    });
    const savedPayment = await this.paymentRepo.save(payment);

    const tapResponse = await this.createCharge({
      cartId,
      description: `Booking #${booking.id} - Partial Payment (Offer #${offerId})`,
      amount: offerPartialSummary.amountAfterCoupon,
      customerName: account.email || account.phone || 'Customer',
      customerEmail: account.email || 'no-email@tripmate.com',
      customerPhone: account.phone || '0500000000',
    });

    savedPayment.transactionReference = tapResponse.id;
    savedPayment.gatewayResponse = tapResponse;
    await this.paymentRepo.save(savedPayment);

    this.logger.log(
      `Offer partial payment initiated: cartId=${cartId}, amount=${offerPartialSummary.amountAfterCoupon}, discount=${offerPartialSummary.discountAmount || 0}, chargeId=${tapResponse.id}`,
    );

    return {
      redirectUrl: tapResponse.transaction.url,
      transactionId: savedPayment.id,
      chargeId: tapResponse.id,
      discountAmount: offerPartialSummary.discountAmount,
    };
  }

  // ─── BOOKING FULL PAYMENT (remaining 75%) ─────────────────────────

  async initiateOfferFullPayment(
    accountId: bigint,
    offerId: number,
    couponCode?: string,
  ): Promise<{ redirectUrl: string; transactionId: bigint; chargeId: string; discountAmount?: number }> {
    const { offer, booking, account } = await this.resolveOfferPaymentContext(accountId, offerId);

    if(booking.status === BookingStatus.COMPLETED) {
      throw new BadRequestException('Booking already completed, cannot initiate full payment');
    }
    const partialPayment = await this.paymentRepo.findOne({
      where: { booking: { id: booking.id }, type: PaymentType.BOOKING_PARTIAL },
    });
    if (!partialPayment) {
      throw new BadRequestException('Partial payment not found, cannot initiate full payment');
    }

    const amount = partialPayment.advanceAmount ? offer.price - Number(partialPayment.advanceAmount) : Number(partialPayment.amount);


    const cartId = `OF-FULL-${offerId}-${Date.now()}`;

    const payment = this.paymentRepo.create({
      cartId,
      type: PaymentType.BOOKING_FULL,
      status: PaymentStatus.PENDING,
      amount,
      currency: this.currency,
      payerAccount: account,
      booking,
    });
    const savedPayment = await this.paymentRepo.save(payment);

    const tapResponse = await this.createCharge({
      cartId,
      description: `Booking #${booking.id} - Full Payment (Offer #${offerId}, Remaining)`,
      amount,
      customerName: account.email || account.phone || 'Customer',
      customerEmail: account.email || 'no-email@tripmate.com',
      customerPhone: account.phone || '0500000000',
    });

    savedPayment.transactionReference = tapResponse.id;
    savedPayment.gatewayResponse = tapResponse;
    await this.paymentRepo.save(savedPayment);

    this.logger.log(
      `Offer full payment initiated: cartId=${cartId}, amount=${amount}, discount=${partialPayment.discountAmount || 0}, chargeId=${tapResponse.id}`,
    );

    return {
      redirectUrl: tapResponse.transaction.url,
      transactionId: savedPayment.id,
      chargeId: tapResponse.id,
      discountAmount: partialPayment.discountAmount,
    };
  }

  // ─── TAP WEBHOOK HANDLER ──────────────────────────────────────────

  async handleWebhook(payload: Record<string, any>): Promise<void> {
    this.logger.log(`Tap webhook received: ${JSON.stringify(payload)}`);

    const chargeId = payload.id;
    if (!chargeId) {
      this.logger.error('Webhook missing charge id');
      return;
    }

    // Check if this is a card verification
    const isCardVerification = payload.metadata?.type === 'card_verification';

    // Find payment by charge ID (transactionReference) or cart ID from metadata
    let payment = await this.paymentRepo.findOne({
      where: { transactionReference: chargeId },
      relations: ['booking', 'subscriptionPlan', 'payerAccount'],
    });

    if (!payment && payload.metadata?.cartId) {
      payment = await this.paymentRepo.findOne({
        where: { cartId: payload.metadata.cartId },
        relations: ['booking', 'subscriptionPlan', 'payerAccount'],
      });
    }

    if (!payment) {
      this.logger.error(`Payment not found for chargeId: ${chargeId}`);
      return;
    }

    // Verify payment by retrieving charge from Tap
    const verificationResult = await this.retrieveCharge(chargeId);
    const isSuccess = verificationResult.status === 'CAPTURED';

    // Update payment record
    payment.status = isSuccess ? PaymentStatus.SUCCESS : PaymentStatus.FAILED;
    payment.gatewayResponse = verificationResult;
    await this.paymentRepo.save(payment);

    if (!isSuccess) {
      this.logger.warn(
        `Payment failed: chargeId=${chargeId}, status=${verificationResult.status}`,
      );
      return;
    }

    this.logger.log(`Payment successful: chargeId=${chargeId}, type=${payment.type}`);

    // Handle side effects based on payment type (skip for card verification)
    if (!isCardVerification) {
      switch (payment.type) {
        case PaymentType.SUBSCRIPTION:
          await this.handleSubscriptionPaymentSuccess(payment);
          break;
        case PaymentType.BOOKING_PARTIAL:
          await this.handleBookingPartialPaymentSuccess(payment);
          break;
        case PaymentType.BOOKING_FULL:
          await this.handleBookingFullPaymentSuccess(payment);
          break;
      }
    }
  }

  // ─── PAYMENT VERIFICATION (Retrieve Charge) ───────────────────────

  async retrieveCharge(chargeId: string): Promise<Record<string, any>> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/charges/${chargeId}`,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      this.logger.log(
        `Charge retrieved for ${chargeId}: ${JSON.stringify(response.data)}`,
      );

      return response.data;
    } catch (error: any) {
      this.logger.error(
        `Failed to retrieve charge ${chargeId}: ${error.message}`,
      );
      throw new BadRequestException('Payment verification failed');
    }
  }

  async renderPaymentRedirectPage(transactionRef?: string): Promise<string> {
    const chargeId = this.resolveRedirectTransactionRef(transactionRef);

    if (!chargeId) {
      return this.loadPaymentHtml('payment-fail.html');
    }

    const payment = await this.paymentRepo.findOne({
      where: [{ transactionReference: chargeId }, { cartId: chargeId }],
      relations: ['booking', 'subscriptionPlan', 'payerAccount'],
    });

    if (!payment) {
      this.logger.error(`Redirect payment not found for chargeId: ${chargeId}`);
      return this.loadPaymentHtml('payment-fail.html');
    }

    const wasAlreadySuccessful = payment.status === PaymentStatus.SUCCESS;

    try {
      const verificationResult = await this.retrieveCharge(chargeId);
      const isSuccess = verificationResult.status === 'CAPTURED';

      payment.status = isSuccess ? PaymentStatus.SUCCESS : PaymentStatus.FAILED;
      payment.gatewayResponse = verificationResult;
      payment.transactionReference = chargeId;
      await this.paymentRepo.save(payment);

      if (!isSuccess) {
        return this.loadPaymentHtml('payment-fail.html');
      }

      if (!wasAlreadySuccessful && verificationResult?.metadata?.type !== 'card_verification') {
        await this.handlePaymentSuccessSideEffects(payment);
      }

      return this.loadPaymentHtml('payment-success.html');
    } catch (error: any) {
      this.logger.error(
        `Failed to render payment redirect page for ${chargeId}: ${error.message}`,
      );
      return this.loadPaymentHtml('payment-fail.html');
    }
  }

  // ─── GET PAYMENT STATUS ───────────────────────────────────────────

  async getPaymentByTransactionRef(
    transactionRef: string,
  ): Promise<PaymentTransaction> {
    const payment = await this.paymentRepo.findOne({
      where: { transactionReference: transactionRef },
      relations: ['booking', 'subscriptionPlan', 'payerAccount'],
    });

    if (!payment) {
      throw new NotFoundException(
        `Payment not found for transaction reference: ${transactionRef}`,
      );
    }

    return payment;
  }


  async getPaymentsByAccountPaginated(
    accountId: bigint,
    dto: PaginationDto,
  ): Promise<
    PaginatedResponseDto<{
      offerId: number | null;
      bookingId: number | null;
      bookingType: string | null;
      createdAt: Date;
      totalPaidByUser: number;
      bookingStatus: string | null;
    }>
  > {
    const [payments, total] = await this.paymentRepo
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.booking', 'booking')
      .leftJoinAndSelect('booking.selectedOffer', 'selectedOffer')
      .where('payment.payer_account_id = :accountId', { accountId })
      .andWhere('payment.booking_id IS NOT NULL')
      .andWhere('payment.status =:status' , {status: PaymentStatus.SUCCESS})
      .andWhere(
        `(payment.type != :partialType OR NOT EXISTS (
          SELECT 1
          FROM payment_transactions full_payment
          WHERE full_payment.booking_id = payment.booking_id
            AND full_payment.payer_account_id = payment.payer_account_id
            AND full_payment.type = :fullType
            AND full_payment.status = :status 
        ))`,
        {
          partialType: PaymentType.BOOKING_PARTIAL,
          fullType: PaymentType.BOOKING_FULL,
          status : PaymentStatus.SUCCESS
        },
      )
      .orderBy('payment.createdAt', 'DESC')
      .skip(dto.skip)
      .take(dto.limit)
      .getManyAndCount();

    const data = payments.map((payment) => {
      const offerIdFromBooking = payment.booking?.selectedOffer?.id
        ? Number(payment.booking.selectedOffer.id)
        : null;

      const offerIdFromCart = this.extractOfferIdFromCartId(payment.cartId);

      return {
        offerId:
          offerIdFromBooking ??
          (offerIdFromCart !== null ? Number(offerIdFromCart) : null),
        bookingId: payment.booking?.id ? Number(payment.booking.id) : null,
        bookingType: payment.booking?.type ?? null,
        createdAt: payment.createdAt,
        totalPaidByUser: this.toNumber(payment.amount),
        bookingStatus: payment.booking?.status ?? null,
      };
    });

    return new PaginatedResponseDto(data, total, dto.page, dto.limit);
  }


  // ─── PRIVATE HELPERS ──────────────────────────────────────────────

  private async handleSubscriptionPaymentSuccess(
    payment: PaymentTransaction,
  ): Promise<void> {
    if (!payment.subscriptionPlan || !payment.payerAccount) {
      this.logger.error('Subscription payment missing plan or account data');
      return;
    }

    try {
      await this.subscriptionService.subscribeToPlan(
        payment.payerAccount.id,
        Number(payment.subscriptionPlan.id),
      );
      this.logger.log(
        `Subscription activated for account ${payment.payerAccount.id}, plan ${payment.subscriptionPlan.id}`,
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to activate subscription: ${error.message}`,
      );
    }
  }

  private async handleBookingPartialPaymentSuccess(
    payment: PaymentTransaction,
  ): Promise<void> {
    try {
      const offerId = this.extractOfferIdFromCartId(payment.cartId);
      if (!offerId) {
        this.logger.error(`Cannot resolve offer id from cartId: ${payment.cartId}`);
        return;
      }

      const offer = await this.offerRepo.findOne({
        where: { id: offerId },
        relations: ['booking', 'office'],
      });

      if (!offer?.booking) {
        this.logger.error(`Offer ${offerId} not found for partial payment success`);
        return;
      }

      const booking = await this.bookingRepo.findOne({
        where: { id: offer.booking.id },
        relations: ['selectedOffer', 'selectedOffer.office'],
      });

      if (!booking) {
        this.logger.error(`Booking ${offer.booking.id} not found`);
        return;
      }

      if (offer.status !== OfferStatus.ACCEPTED) {
        offer.status = OfferStatus.ACCEPTED;
        await this.offerRepo.save(offer);
      }

      if (!booking.selectedOffer || booking.selectedOffer.id.toString() !== offer.id.toString()) {
        booking.selectedOffer = offer;
      }

      if (booking.status === BookingStatus.UNDER_NEGOTIATION) {
        booking.changeStatus(BookingStatus.OFFER_ACCEPTED);
      }

      const split = await this.calculateWalletSplitForBookingPayment(
        offer,
        booking.id,
        Number(payment.amount),
        payment.cartId,
      );

      // Update paid amount
      booking.paidAmount = Number(booking.paidAmount || 0) + split.officeAmount;

      // Transition to PARTIALLY_PAID
      if (booking.status === BookingStatus.OFFER_ACCEPTED) {
        booking.changeStatus(BookingStatus.PARTIALLY_PAID);
      }

      await this.bookingRepo.save(booking);

      // Credit office wallet with pending funds
      if (offer.office?.accountId && split.officeAmount > 0) {
        await this.walletService.creditPending(
          offer.office.accountId,
          split.officeAmount,
          booking.id,
        );
      }

      if (split.adminAmount > 0) {
        await this.walletService.creditAdminAvailable(split.adminAmount, booking.id);
      }

      this.logger.log(
        `Booking ${booking.id} partially paid. Charged=${payment.amount}, office=${split.officeAmount}, admin=${split.adminAmount}`,
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to update booking for partial payment: ${error.message}`,
      );
    }
  }

  private async handleBookingFullPaymentSuccess(
    payment: PaymentTransaction,
  ): Promise<void> {
    try {
      const offerId = this.extractOfferIdFromCartId(payment.cartId);
      if (!offerId) {
        this.logger.error(`Cannot resolve offer id from cartId: ${payment.cartId}`);
        return;
      }

      const offer = await this.offerRepo.findOne({
        where: { id: offerId },
        relations: ['booking', 'office'],
      });

      if (!offer?.booking) {
        this.logger.error(`Offer ${offerId} not found for full payment success`);
        return;
      }

      const booking = await this.bookingRepo.findOne({
        where: { id: offer.booking.id },
        relations: ['selectedOffer', 'selectedOffer.office'],
      });

      if (!booking) {
        this.logger.error(`Booking ${offer.booking.id} not found`);
        return;
      }

      if (offer.status !== OfferStatus.ACCEPTED) {
        offer.status = OfferStatus.ACCEPTED;
        await this.offerRepo.save(offer);
      }

      if (!booking.selectedOffer || booking.selectedOffer.id.toString() !== offer.id.toString()) {
        booking.selectedOffer = offer;
      }

      if (booking.status === BookingStatus.UNDER_NEGOTIATION) {
        booking.changeStatus(BookingStatus.OFFER_ACCEPTED);
      }

      if (booking.status === BookingStatus.OFFER_ACCEPTED) {
        booking.changeStatus(BookingStatus.PARTIALLY_PAID);
      }

      const split = await this.calculateWalletSplitForBookingPayment(
        offer,
        booking.id,
        Number(payment.amount),
        payment.cartId,
      );

      // Update paid amount
      booking.paidAmount = Number(booking.paidAmount || 0) + split.officeAmount;

      // Transition to COMPLETED
      if (booking.status === BookingStatus.PARTIALLY_PAID) {
        booking.changeStatus(BookingStatus.COMPLETED);
      }

      await this.bookingRepo.save(booking);

      // Credit office wallet with pending funds
      if (offer.office?.accountId && split.officeAmount > 0) {
        await this.walletService.creditPending(
          offer.office.accountId,
          split.officeAmount,
          booking.id,
        );
      }

      if (split.adminAmount > 0) {
        await this.walletService.creditAdminAvailable(split.adminAmount, booking.id);
      }

      this.logger.log(
        `Booking ${booking.id} fully paid and completed. Total paid to office: ${booking.paidAmount}, admin collected: ${split.adminAmount}`,
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to update booking for full payment: ${error.message}`,
      );
    }
  }

  private async handlePaymentSuccessSideEffects(
    payment: PaymentTransaction,
  ): Promise<void> {
    switch (payment.type) {
      case PaymentType.SUBSCRIPTION:
        await this.handleSubscriptionPaymentSuccess(payment);
        break;
      case PaymentType.BOOKING_PARTIAL:
        await this.handleBookingPartialPaymentSuccess(payment);
        break;
      case PaymentType.BOOKING_FULL:
        await this.handleBookingFullPaymentSuccess(payment);
        break;
    }
  }

  private async calculateWalletSplitForBookingPayment(
    offer: Offer,
    bookingId: bigint,
    paymentAmount: number,
    cartId: string,
  ): Promise<{ officeAmount: number; adminAmount: number }> {
    const roundedPaymentAmount = Math.round(Math.max(paymentAmount, 0) * 100) / 100;
    if (!offer.office?.accountId || roundedPaymentAmount <= 0) {
      return { officeAmount: 0, adminAmount: 0 };
    }

    // Saved-card booking payments currently charge offer amount only (no tax/commission surcharge).
    if (cartId.startsWith('OF-SAVED-')) {
      const alreadyCreditedOffice = await this.walletService.getTotalCreditedForBooking(
        offer.office.accountId,
        bookingId,
      );
      const officeRemaining =
        Math.round(Math.max(Number(offer.price) - alreadyCreditedOffice, 0) * 100) /
        100;
      return {
        officeAmount: Math.round(Math.min(roundedPaymentAmount, officeRemaining) * 100) / 100,
        adminAmount: 0,
      };
    }

    const settings = await this.getPaymentSettings();
    const offerPrice = Number(offer.price || 0);
    const appCommissionAmount =
      Math.round(((offerPrice * Number(settings.appCommission || 0)) / 100) * 100) /
      100;
    const taxAmount =
      Math.round(((offerPrice * Number(settings.taxValue || 0)) / 100) * 100) / 100;
    const totalAdminTarget = Math.round((appCommissionAmount + taxAmount) * 100) / 100;

    const alreadyCreditedOffice = await this.walletService.getTotalCreditedForBooking(
      offer.office.accountId,
      bookingId,
    );
    const officeRemaining =
      Math.round(Math.max(offerPrice - alreadyCreditedOffice, 0) * 100) / 100;

    const adminAccountId = await this.walletService.getPrimaryAdminAccountId();
    const alreadyCreditedAdmin = adminAccountId
      ? await this.walletService.getTotalCreditedForBooking(adminAccountId, bookingId)
      : 0;
    const adminRemaining =
      Math.round(Math.max(totalAdminTarget - alreadyCreditedAdmin, 0) * 100) / 100;

    let remainingPayment = roundedPaymentAmount;
    const adminAmount =
      Math.round(Math.min(adminRemaining, remainingPayment) * 100) / 100;
    remainingPayment = Math.round((remainingPayment - adminAmount) * 100) / 100;

    const officeAmount =
      Math.round(Math.min(officeRemaining, remainingPayment) * 100) / 100;

    return { officeAmount, adminAmount };
  }

  private resolveRedirectTransactionRef(transactionRef?: string): string | null {
    if (!transactionRef) {
      return null;
    }

    const normalized = transactionRef.trim();
    return normalized.length > 0 ? normalized : null;
  }

  private async loadPaymentHtml(fileName: string): Promise<string> {
    const filePath = join(process.cwd(), 'public', fileName);

    try {
      return await readFile(filePath, 'utf8');
    } catch (error: any) {
      this.logger.error(
        `Failed to read payment html file ${filePath}: ${error.message}`,
      );

      const isSuccessPage = fileName.toLowerCase().includes('success');
      return this.getFallbackPaymentHtml(isSuccessPage);
    }
  }

  private getFallbackPaymentHtml(isSuccessPage: boolean): string {
    const title = isSuccessPage ? 'Payment Successful' : 'Payment Failed';
    const message = isSuccessPage
      ? 'Your payment has been verified successfully.'
      : 'We could not verify your payment.';

    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <style>
      body { font-family: Arial, Helvetica, sans-serif; display: grid; place-items: center; min-height: 100vh; margin: 0; background: #f8fafc; color: #0f172a; }
      .card { width: min(520px, 92%); background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 28px; text-align: center; }
      h1 { margin: 0 0 10px; font-size: 28px; }
      p { margin: 0; color: #475569; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>${title}</h1>
      <p>${message}</p>
    </div>
  </body>
</html>`;
  }

  private async createCharge(params: {
    cartId: string;
    description: string;
    amount: number;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
  }): Promise<Record<string, any>> {
    try {
      const requestBody = {
        amount: params.amount,
        currency: this.currency,
        // threeDSecure: true,
        // save_card: true,
        source: { id: 'src_all' },
        customer: {
          first_name: params.customerName,
          email: params.customerEmail,
          phone: {
            country_code: '966',
            number: params.customerPhone,
          },
        },
        redirect: { url: this.redirectUrl },
        post: { url: this.webhookUrl },
        description: params.description,
        metadata: { cartId: params.cartId },
      };

      this.logger.log(
        `Creating Tap charge: ${JSON.stringify(requestBody)}`,
      );

      const response = await axios.post(
        `${this.baseUrl}/charges/`,
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.data.transaction?.url) {
        this.logger.error(
          `Tap charge creation failed: ${JSON.stringify(response.data)}`,
        );
        throw new BadRequestException(
          'Failed to create charge. Tap response: ' +
          JSON.stringify(response.data),
        );
      }

      return response.data;
    } catch (error: any) {
      console.log('TAP ERROR:', error.response?.data);

      if (error instanceof BadRequestException) throw error;

      throw new BadRequestException(
        error.response?.data || 'Failed to communicate with payment gateway',
      );
    }
  }


  private extractOfferIdFromCartId(cartId: string): bigint | null {
    const matched = cartId.match(/^OF-(?:PARTIAL|FULL|SAVED)-(\d+)-/);
    if (!matched?.[1]) {
      return null;
    }

    try {
      return BigInt(matched[1]);
    } catch {
      return null;
    }
  }

  private toNumber(value: unknown): number {
    if (typeof value === 'number') {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    }

    return 0;
  }

  private async resolveOfferPaymentContext(
    accountId: bigint,
    offerId: number,
  ): Promise<{ offer: Offer; booking: Booking; account: Account }> {
    const offer = await this.offerRepo.findOne({
      where: { id: BigInt(offerId) },
      relations: ['booking', 'booking.user', 'booking.user.account', 'booking.selectedOffer' ,'office'],
    });

    if (!offer) throw new NotFoundException('Offer not found');

    if (offer.booking.user.account.id.toString() !== accountId.toString()) {
      throw new BadRequestException('This offer does not belong to your booking');
    }


    const account = await this.accountRepo.findOne({
      where: { id: accountId },
    });
    if (!account) throw new NotFoundException('Account not found');

    return { offer, booking: offer.booking, account };
  }

  async getUserPaymentHistory(
    accountId: bigint,
    paymentId: bigint | undefined,
    dto: PaginationDto,
  ): Promise<PaginatedResponseDto<Record<string, unknown>>> {
    const where: any = {
      payerAccount: { id: accountId },
      status: PaymentStatus.SUCCESS,
    };

    if (paymentId) {
      where.id = paymentId;
    }

    const [payments, total] = await this.paymentRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: dto.skip,
      take: dto.limit,
      relations: ['booking', 'subscriptionPlan', 'payerAccount'],
    });

    const formattedPayments = payments.map((payment) => {
      return {
        id: payment.id,
        type: payment.type,
        amount: this.toNumber(payment.amount),
        currency: payment.currency,
        status: payment.status,
        createdAt: payment.createdAt,
      }
    });

    return new PaginatedResponseDto(formattedPayments, total, dto.page, dto.limit);
  }
}
