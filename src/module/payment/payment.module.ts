import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';
import { PaymentTransaction } from './entity/payment-transaction.entity';
import { SavedCard } from './entity/saved-card.entity';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { SubscriptionModule } from '../subscription/subscription.module';
import { OffersModule } from '../offers/offers.module';
import { Booking } from '../bookings/domain/entity/booking.entity';
import { SubscriptionPlan } from '../subscription/entity/subscription-plan.entity';
import { Account } from '../account/entity/account.entity';
import { WalletModule } from '../wallet/wallet.module';
import { CouponModule } from '../coupon/coupon.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PaymentTransaction,
      SavedCard,
      Booking,
      SubscriptionPlan,
      Account,
    ]),
    SubscriptionModule,
    OffersModule,
    WalletModule,
    CouponModule,
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}

