import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Coupon } from './coupon.entity';
import { Account } from '../../account/entity/account.entity';
import { Booking } from '../../bookings/domain/entity/booking.entity';

@Entity('coupon_usages')
export class CouponUsage {
  @PrimaryGeneratedColumn('identity')
  id: bigint;

  @ManyToOne(() => Coupon, (coupon) => coupon.usages, { nullable: false })
  @JoinColumn({ name: 'coupon_id' })
  coupon: Coupon;

  @ManyToOne(() => Account, { nullable: false })
  @JoinColumn({ name: 'account_id' })
  account: Account;

  @ManyToOne(() => Booking, { nullable: false })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  discountAmount: number;

  @CreateDateColumn()
  usedAt: Date;
}
