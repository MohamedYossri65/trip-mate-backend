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
import { PaymentTransaction } from './entity/payment-transaction.entity';
import { SavedCard } from './entity/saved-card.entity';
import { PaymentType } from './enum/payment-type.enum';
import { PaymentStatus } from './enum/payment-status.enum';
import { SubscriptionService } from '../subscription/subscription.service';
import { OffersService } from '../offers/offers.service';
import { Booking } from '../bookings/domain/entity/booking.entity';
import { BookingStatus } from '../bookings/domain/enum/booking-status.enum';
import { SubscriptionPlan } from '../subscription/entity/subscription-plan.entity';
import { Account } from '../account/entity/account.entity';
import { WalletService } from '../wallet/wallet.service';
import { CouponService } from '../coupon/coupon.service';

const PARTIAL_PAYMENT_PERCENTAGE = 0.25;

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

    @InjectRepository(SubscriptionPlan)
    private readonly planRepo: Repository<SubscriptionPlan>,

    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,

    @InjectRepository(SavedCard)
    private readonly savedCardRepo: Repository<SavedCard>,

    private readonly subscriptionService: SubscriptionService,
    private readonly offersService: OffersService,
    private readonly configService: ConfigService,
    private readonly walletService: WalletService,
    private readonly couponService: CouponService,
  ) {
    this.secretKey = this.configService.get<string>('TAP_SECRET_KEY', '');
    this.currency = this.configService.get<string>('TAP_CURRENCY', 'SAR');
    this.webhookUrl = this.configService.get<string>('TAP_WEBHOOK_URL', '');
    this.redirectUrl = this.configService.get<string>('TAP_REDIRECT_URL', '');
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

  // ─── BOOKING PARTIAL PAYMENT (25%) ────────────────────────────────

  async initiateBookingPartialPayment(
    accountId: bigint,
    bookingId: number,
    couponCode?: string,
  ): Promise<{ redirectUrl: string; transactionId: bigint; chargeId: string; discountAmount?: number }> {
    const booking = await this.bookingRepo.findOne({
      where: { id: BigInt(bookingId) },
      relations: ['selectedOffer', 'user', 'user.account'],
    });

    if (!booking) throw new NotFoundException('Booking not found');

    if (booking.user.account.id.toString() !== accountId.toString()) {
      throw new BadRequestException('This booking does not belong to you');
    }

    if (booking.status !== BookingStatus.OFFER_ACCEPTED) {
      throw new BadRequestException(
        'Booking must have an accepted offer before payment. Current status: ' +
        booking.status,
      );
    }

    if (!booking.selectedOffer) {
      throw new BadRequestException('No accepted offer found for this booking');
    }

    const offerPrice = Number(booking.selectedOffer.price);
    let chargeAmount = Math.round(offerPrice * PARTIAL_PAYMENT_PERCENTAGE * 100) / 100;
    let discountAmount: number | undefined;

    // Apply coupon discount if provided
    if (couponCode) {
      const couponResult = await this.couponService.validateAndApply(
        couponCode,
        accountId,
        BigInt(bookingId),
        chargeAmount,
      );
      discountAmount = couponResult.discountAmount;
      chargeAmount = couponResult.finalAmount;
    }

    const account = await this.accountRepo.findOne({
      where: { id: accountId },
    });
    if (!account) throw new NotFoundException('Account not found');

    const cartId = `BK-PARTIAL-${bookingId}-${Date.now()}`;

    const payment = this.paymentRepo.create({
      cartId,
      type: PaymentType.BOOKING_PARTIAL,
      status: PaymentStatus.PENDING,
      amount: chargeAmount,
      currency: this.currency,
      payerAccount: account,
      booking,
      ...(couponCode ? { couponCode, discountAmount } : {}),
    });
    const savedPayment = await this.paymentRepo.save(payment);

    const tapResponse = await this.createCharge({
      cartId,
      description: `Booking #${bookingId} - Partial Payment (25%)`,
      amount: chargeAmount,
      customerName: account.email || account.phone || 'Customer',
      customerEmail: account.email || 'no-email@tripmate.com',
      customerPhone: account.phone || '0500000000',
    });

    savedPayment.transactionReference = tapResponse.id;
    savedPayment.gatewayResponse = tapResponse;
    await this.paymentRepo.save(savedPayment);

    this.logger.log(
      `Booking partial payment initiated: cartId=${cartId}, amount=${chargeAmount}, discount=${discountAmount || 0}, chargeId=${tapResponse.id}`,
    );

    return {
      redirectUrl: tapResponse.transaction.url,
      transactionId: savedPayment.id,
      chargeId: tapResponse.id,
      discountAmount,
    };
  }

  // ─── BOOKING FULL PAYMENT (remaining 75%) ─────────────────────────

  async initiateBookingFullPayment(
    accountId: bigint,
    bookingId: number,
    couponCode?: string,
  ): Promise<{ redirectUrl: string; transactionId: bigint; chargeId: string; discountAmount?: number }> {
    const booking = await this.bookingRepo.findOne({
      where: { id: BigInt(bookingId) },
      relations: ['selectedOffer', 'user', 'user.account'],
    });

    if (!booking) throw new NotFoundException('Booking not found');

    if (booking.user.account.id.toString() !== accountId.toString()) {
      throw new BadRequestException('This booking does not belong to you');
    }

    if (booking.status !== BookingStatus.PARTIALLY_PAID) {
      throw new BadRequestException(
        'Booking must be partially paid before full payment. Current status: ' +
        booking.status,
      );
    }

    if (!booking.selectedOffer) {
      throw new BadRequestException('No accepted offer found for this booking');
    }

    const offerPrice = Number(booking.selectedOffer.price);
    const paidAmount = Number(booking.paidAmount || 0);
    let chargeAmount = Math.round((offerPrice - paidAmount) * 100) / 100;
    let discountAmount: number | undefined;

    if (chargeAmount <= 0) {
      throw new BadRequestException('No remaining amount to pay');
    }

    // Apply coupon discount if provided
    if (couponCode) {
      const couponResult = await this.couponService.validateAndApply(
        couponCode,
        accountId,
        BigInt(bookingId),
        chargeAmount,
      );
      discountAmount = couponResult.discountAmount;
      chargeAmount = couponResult.finalAmount;
    }

    const account = await this.accountRepo.findOne({
      where: { id: accountId },
    });
    if (!account) throw new NotFoundException('Account not found');

    const cartId = `BK-FULL-${bookingId}-${Date.now()}`;

    const payment = this.paymentRepo.create({
      cartId,
      type: PaymentType.BOOKING_FULL,
      status: PaymentStatus.PENDING,
      amount: chargeAmount,
      currency: this.currency,
      payerAccount: account,
      booking,
      ...(couponCode ? { couponCode, discountAmount } : {}),
    });
    const savedPayment = await this.paymentRepo.save(payment);

    const tapResponse = await this.createCharge({
      cartId,
      description: `Booking #${bookingId} - Full Payment (Remaining)`,
      amount: chargeAmount,
      customerName: account.email || account.phone || 'Customer',
      customerEmail: account.email || 'no-email@tripmate.com',
      customerPhone: account.phone || '0500000000',
    });

    savedPayment.transactionReference = tapResponse.id;
    savedPayment.gatewayResponse = tapResponse;
    await this.paymentRepo.save(savedPayment);

    this.logger.log(
      `Booking full payment initiated: cartId=${cartId}, amount=${chargeAmount}, discount=${discountAmount || 0}, chargeId=${tapResponse.id}`,
    );

    return {
      redirectUrl: tapResponse.transaction.url,
      transactionId: savedPayment.id,
      chargeId: tapResponse.id,
      discountAmount,
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

    // Save card if card data is present and save_card was true
    if (verificationResult.card?.id && verificationResult.save_card) {
      await this.saveCardFromWebhook(chargeId, verificationResult);
    }

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
    } catch (error) {
      this.logger.error(
        `Failed to retrieve charge ${chargeId}: ${error.message}`,
      );
      throw new BadRequestException('Payment verification failed');
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

  async getPaymentsByAccount(accountId: bigint): Promise<PaymentTransaction[]> {
    return this.paymentRepo.find({
      where: { payerAccount: { id: accountId } },
      relations: ['booking', 'subscriptionPlan'],
      order: { createdAt: 'DESC' },
    });
  }

  // ─── SAVED CARD MANAGEMENT ────────────────────────────────────────

  async verifyAndSaveCard(
    accountId: bigint,
    setAsDefault = false,
  ): Promise<{ redirectUrl: string; chargeId: string }> {
    const account = await this.accountRepo.findOne({
      where: { id: accountId },
    });
    if (!account) throw new NotFoundException('Account not found');

    const cartId = `VERIFY-CARD-${accountId}-${Date.now()}`;

    // Create verification charge (0.01 SAR or minimum amount)
    const tapResponse = await this.createVerifyCharge({
      cartId,
      customerName: account.email || account.phone || 'Customer',
      customerEmail: account.email || 'no-email@tripmate.com',
      customerPhone: account.phone || '0500000000',
    });

    // Store temporary reference to link webhook callback
    const payment = this.paymentRepo.create({
      cartId,
      type: PaymentType.SUBSCRIPTION, // Use existing enum or create CARD_VERIFICATION
      status: PaymentStatus.PENDING,
      amount: 0.01,
      currency: this.currency,
      payerAccount: account,
      gatewayResponse: tapResponse,
      transactionReference: tapResponse.id,
    });
    await this.paymentRepo.save(payment);

    this.logger.log(
      `Card verification initiated: accountId=${accountId}, chargeId=${tapResponse.id}`,
    );

    return {
      redirectUrl: tapResponse.transaction.url,
      chargeId: tapResponse.id,
    };
  }

  async saveCardFromWebhook(
    chargeId: string,
    payload: Record<string, any>,
  ): Promise<SavedCard | null> {
    const cardData = payload.card;
    if (!cardData?.id) {
      this.logger.warn('No card data in webhook payload');
      return null;
    }

    // Find the payment transaction to get account
    const payment = await this.paymentRepo.findOne({
      where: { transactionReference: chargeId },
      relations: ['payerAccount'],
    });

    if (!payment?.payerAccount) {
      this.logger.error('Payment or account not found for card save');
      return null;
    }

    // Check if card already exists
    const existingCard = await this.savedCardRepo.findOne({
      where: { tapCardId: cardData.id },
    });

    if (existingCard) {
      this.logger.log(`Card already saved: ${cardData.id}`);
      return existingCard;
    }

    // Create new saved card
    const savedCard = this.savedCardRepo.create({
      account: payment.payerAccount,
      tapCardId: cardData.id,
      tapCustomerId: payload.customer?.id,
      cardBrand: cardData.brand || 'UNKNOWN',
      lastFour: cardData.last_four || '0000',
      firstSix: cardData.first_six,
      expiryMonth: cardData.exp_month?.toString(),
      expiryYear: cardData.exp_year?.toString(),
      cardholderName: cardData.name,
      isDefault: false,
      isActive: true,
    });

    const saved = await this.savedCardRepo.save(savedCard);
    this.logger.log(
      `Card saved: id=${saved.id}, tapCardId=${cardData.id}, accountId=${payment.payerAccount.id}`,
    );

    return saved;
  }

  async getSavedCards(accountId: bigint): Promise<SavedCard[]> {
    return this.savedCardRepo.find({
      where: { account: { id: accountId }, isActive: true },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
  }

  async getSavedCard(accountId: bigint, cardId: number): Promise<SavedCard> {
    const card = await this.savedCardRepo.findOne({
      where: { id: BigInt(cardId), account: { id: accountId } },
    });

    if (!card) {
      throw new NotFoundException('Saved card not found');
    }

    return card;
  }

  async updateSavedCard(
    accountId: bigint,
    cardId: number,
    updates: { isDefault?: boolean; isActive?: boolean },
  ): Promise<SavedCard> {
    const card = await this.getSavedCard(accountId, cardId);

    // If setting as default, unset other cards
    if (updates.isDefault === true) {
      await this.savedCardRepo.update(
        { account: { id: accountId } },
        { isDefault: false },
      );
    }

    Object.assign(card, updates);
    const updated = await this.savedCardRepo.save(card);

    this.logger.log(
      `Card updated: id=${cardId}, accountId=${accountId}, updates=${JSON.stringify(updates)}`,
    );

    return updated;
  }

  async deleteSavedCard(accountId: bigint, cardId: number): Promise<void> {
    const card = await this.getSavedCard(accountId, cardId);

    await this.savedCardRepo.remove(card);

    this.logger.log(`Card deleted: id=${cardId}, accountId=${accountId}`);
  }

  // ─── PAYMENT WITH SAVED CARD ──────────────────────────────────────

  async payWithSavedCard(params: {
    accountId: bigint;
    cardId: number;
    bookingId: number;
    paymentType: 'PARTIAL' | 'FULL';
    couponCode?: string;
  }): Promise<{ transactionId: bigint; chargeId: string }> {
    const card = await this.getSavedCard(params.accountId, params.cardId);

    if (!card.isActive) {
      throw new BadRequestException('This card is inactive');
    }

    const booking = await this.bookingRepo.findOne({
      where: { id: BigInt(params.bookingId) },
      relations: ['selectedOffer', 'user', 'user.account'],
    });

    if (!booking) throw new NotFoundException('Booking not found');

    if (booking.user.account.id.toString() !== params.accountId.toString()) {
      throw new BadRequestException('This booking does not belong to you');
    }

    if (!booking.selectedOffer) {
      throw new BadRequestException('No accepted offer found for this booking');
    }

    // Calculate amount based on payment type
    let chargeAmount: number;
    let description: string;
    let type: PaymentType;

    if (params.paymentType === 'PARTIAL') {
      if (booking.status !== BookingStatus.OFFER_ACCEPTED) {
        throw new BadRequestException(
          'Booking must have an accepted offer before payment',
        );
      }
      const offerPrice = Number(booking.selectedOffer.price);
      chargeAmount = Math.round(offerPrice * PARTIAL_PAYMENT_PERCENTAGE * 100) / 100;
      description = `Booking #${params.bookingId} - Partial Payment (25%)`;
      type = PaymentType.BOOKING_PARTIAL;
    } else {
      if (booking.status !== BookingStatus.PARTIALLY_PAID) {
        throw new BadRequestException('Booking must be partially paid first');
      }
      const offerPrice = Number(booking.selectedOffer.price);
      const paidAmount = Number(booking.paidAmount || 0);
      chargeAmount = Math.round((offerPrice - paidAmount) * 100) / 100;
      description = `Booking #${params.bookingId} - Full Payment (Remaining)`;
      type = PaymentType.BOOKING_FULL;
    }

    // Apply coupon if provided
    let discountAmount: number | undefined;
    if (params.couponCode) {
      const couponResult = await this.couponService.validateAndApply(
        params.couponCode,
        params.accountId,
        BigInt(params.bookingId),
        chargeAmount,
      );
      discountAmount = couponResult.discountAmount;
      chargeAmount = couponResult.finalAmount;
    }

    const account = await this.accountRepo.findOne({
      where: { id: params.accountId },
    });
    if (!account) throw new NotFoundException('Account not found');

    const cartId = `BK-SAVED-${params.bookingId}-${Date.now()}`;

    // Create payment record
    const payment = this.paymentRepo.create({
      cartId,
      type,
      status: PaymentStatus.PENDING,
      amount: chargeAmount,
      currency: this.currency,
      payerAccount: account,
      booking,
      ...(params.couponCode ? { couponCode: params.couponCode, discountAmount } : {}),
    });
    const savedPayment = await this.paymentRepo.save(payment);

    // Charge using saved card
    const tapResponse = await this.createChargeWithSavedCard({
      cardId: card.tapCardId,
      customerId: card.tapCustomerId,
      cartId,
      description,
      amount: chargeAmount,
    });

    savedPayment.transactionReference = tapResponse.id;
    savedPayment.gatewayResponse = tapResponse;
    await this.paymentRepo.save(savedPayment);

    this.logger.log(
      `Payment with saved card: cardId=${params.cardId}, bookingId=${params.bookingId}, chargeId=${tapResponse.id}`,
    );

    return {
      transactionId: savedPayment.id,
      chargeId: tapResponse.id,
    };
  }

  async paySubscriptionWithSavedCard(
    accountId: bigint,
    cardId: number,
    planId: number,
  ): Promise<{ transactionId: bigint; chargeId: string }> {
    const card = await this.getSavedCard(accountId, cardId);

    if (!card.isActive) {
      throw new BadRequestException('This card is inactive');
    }

    const plan = await this.planRepo.findOne({
      where: { id: BigInt(planId) },
    });
    if (!plan) throw new NotFoundException('Subscription plan not found');

    const account = await this.accountRepo.findOne({
      where: { id: accountId },
    });
    if (!account) throw new NotFoundException('Account not found');

    const cartId = `SUB-SAVED-${accountId}-${planId}-${Date.now()}`;

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

    const tapResponse = await this.createChargeWithSavedCard({
      cardId: card.tapCardId,
      customerId: card.tapCustomerId,
      cartId,
      description: `Subscription: ${plan.name}`,
      amount: plan.price,
    });

    savedPayment.transactionReference = tapResponse.id;
    savedPayment.gatewayResponse = tapResponse;
    await this.paymentRepo.save(savedPayment);

    this.logger.log(
      `Subscription payment with saved card: cardId=${cardId}, planId=${planId}, chargeId=${tapResponse.id}`,
    );

    return {
      transactionId: savedPayment.id,
      chargeId: tapResponse.id,
    };
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
    } catch (error) {
      this.logger.error(
        `Failed to activate subscription: ${error.message}`,
      );
    }
  }

  private async handleBookingPartialPaymentSuccess(
    payment: PaymentTransaction,
  ): Promise<void> {
    if (!payment.booking) {
      this.logger.error('Booking partial payment missing booking data');
      return;
    }

    try {
      const booking = await this.bookingRepo.findOne({
        where: { id: payment.booking.id },
        relations: ['selectedOffer', 'selectedOffer.office'],
      });

      if (!booking) {
        this.logger.error(`Booking ${payment.booking.id} not found`);
        return;
      }

      // Update paid amount
      booking.paidAmount = Number(booking.paidAmount || 0) + Number(payment.amount);

      // Transition to PARTIALLY_PAID
      booking.changeStatus(BookingStatus.PARTIALLY_PAID);
      await this.bookingRepo.save(booking);

      // Credit office wallet with pending funds
      if (booking.selectedOffer?.office?.accountId) {
        await this.walletService.creditPending(
          booking.selectedOffer.office.accountId,
          Number(payment.amount),
          booking.id,
        );
      }

      this.logger.log(
        `Booking ${booking.id} partially paid. Amount: ${payment.amount}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to update booking for partial payment: ${error.message}`,
      );
    }
  }

  private async handleBookingFullPaymentSuccess(
    payment: PaymentTransaction,
  ): Promise<void> {
    if (!payment.booking) {
      this.logger.error('Booking full payment missing booking data');
      return;
    }

    try {
      const booking = await this.bookingRepo.findOne({
        where: { id: payment.booking.id },
        relations: ['selectedOffer', 'selectedOffer.office'],
      });

      if (!booking) {
        this.logger.error(`Booking ${payment.booking.id} not found`);
        return;
      }

      // Update paid amount
      booking.paidAmount = Number(booking.paidAmount || 0) + Number(payment.amount);

      // Transition to CONFIRMED
      booking.changeStatus(BookingStatus.CONFIRMED);
      await this.bookingRepo.save(booking);

      // Credit office wallet with pending funds
      if (booking.selectedOffer?.office?.accountId) {
        await this.walletService.creditPending(
          booking.selectedOffer.office.accountId,
          Number(payment.amount),
          booking.id,
        );
      }

      this.logger.log(
        `Booking ${booking.id} fully paid and confirmed. Total paid: ${booking.paidAmount}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to update booking for full payment: ${error.message}`,
      );
    }
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
    } catch (error) {
      console.log('TAP ERROR:', error.response?.data);

      if (error instanceof BadRequestException) throw error;

      throw new BadRequestException(
        error.response?.data || 'Failed to communicate with payment gateway',
      );
    }
  }

  private async createVerifyCharge(params: {
    cartId: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
  }): Promise<Record<string, any>> {
    try {
      const requestBody = {
        amount: 0.01,
        currency: this.currency,
        threeDSecure: true,
        save_card: true,
        source: { id: 'src_card' },
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
        description: 'Card Verification',
        metadata: { cartId: params.cartId, type: 'card_verification' },
      };

      this.logger.log(
        `Creating Tap verify charge: ${JSON.stringify(requestBody)}`,
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
          `Tap verify charge creation failed: ${JSON.stringify(response.data)}`,
        );
        throw new BadRequestException(
          'Failed to create verification charge',
        );
      }

      return response.data;
    } catch (error) {
      this.logger.error('TAP VERIFY ERROR:', error.response?.data);

      if (error instanceof BadRequestException) throw error;

      throw new BadRequestException(
        error.response?.data || 'Failed to verify card with payment gateway',
      );
    }
  }

  private async createChargeWithSavedCard(params: {
    cardId: string;
    customerId?: string;
    cartId: string;
    description: string;
    amount: number;
  }): Promise<Record<string, any>> {
    try {
      const requestBody: any = {
        amount: params.amount,
        currency: this.currency,
        source: { id: params.cardId },
        post: { url: this.webhookUrl },
        description: params.description,
        metadata: { cartId: params.cartId },
      };

      if (params.customerId) {
        requestBody.customer = { id: params.customerId };
      }

      this.logger.log(
        `Creating charge with saved card: ${JSON.stringify(requestBody)}`,
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

      if (!response.data.id) {
        this.logger.error(
          `Tap saved card charge failed: ${JSON.stringify(response.data)}`,
        );
        throw new BadRequestException('Failed to charge saved card');
      }

      return response.data;
    } catch (error) {
      this.logger.error('TAP SAVED CARD ERROR:', error.response?.data);

      if (error instanceof BadRequestException) throw error;

      throw new BadRequestException(
        error.response?.data || 'Failed to charge saved card',
      );
    }
  }
}
