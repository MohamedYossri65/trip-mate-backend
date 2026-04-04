import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { CouponTarget } from '../enum/coupon-target.enum';
import { CouponStatus } from '../enum/coupon-status.enum';
import { DiscountType } from '../enum/discount-type.enum';
import { CouponUsage } from './coupon-usage.entity';

@Entity('coupons')
export class Coupon {
  @PrimaryGeneratedColumn('identity')
  id: bigint;

  @Column()
  name: string;

  @Column({ unique: true })
  code: string;

  @Column({ type: 'enum', enum: CouponTarget })
  target: CouponTarget;

  @Column({ type: 'enum', enum: DiscountType })
  discountType: DiscountType;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  discountValue: number;

  @Column({ type: 'int' })
  maxUsageCount: number;

  @Column({ type: 'int', default: 0 })
  currentUsageCount: number;

  @Column({ type: 'timestamptz' })
  startDate: Date;

  @Column({ type: 'timestamptz' })
  endDate: Date;

  @Column({
    type: 'enum',
    enum: CouponStatus,
    default: CouponStatus.ACTIVE,
  })
  status: CouponStatus;

  @OneToMany(() => CouponUsage, (usage) => usage.coupon)
  usages: CouponUsage[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
