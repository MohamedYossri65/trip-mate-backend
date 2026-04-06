import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PaymentType } from '../enum/payment-type.enum';
import { PaymentStatus } from '../enum/payment-status.enum';
import { Account } from '../../account/entity/account.entity';
import { Booking } from '../../bookings/domain/entity/booking.entity';
import { SubscriptionPlan } from '../../subscription/entity/subscription-plan.entity';

@Entity('payment_transactions')
export class PaymentTransaction {
  @PrimaryGeneratedColumn('identity')
  id: bigint;

  @Column({ unique: true, nullable: true })
  transactionReference: string; // Tap charge ID (chg_…)

  @Column({ unique: true })
  cartId: string; // Our internal cart identifier sent to gateway

  @Column({ type: 'enum', enum: PaymentType })
  type: PaymentType;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ default: 'SAR' })
  currency: string;

  @ManyToOne(() => Account, { nullable: false })
  @JoinColumn({ name: 'payer_account_id' })
  payerAccount: Account;

  @ManyToOne(() => Booking, { nullable: true })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @ManyToOne(() => SubscriptionPlan, { nullable: true })
  @JoinColumn({ name: 'subscription_plan_id' })
  subscriptionPlan: SubscriptionPlan;

  @Column({ nullable: true })
  couponCode: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  discountAmount: number;

  @Column({ type: 'jsonb', nullable: true })
  gatewayResponse: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
