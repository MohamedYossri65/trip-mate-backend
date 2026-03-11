import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SubscriptionPlan } from './subscription-plan.entity';
import { OfficeProfile } from '../../office/entity/office.entity';
import { SubscriptionStatus } from '../enum/subscription-status.enum';

@Entity('office_subscriptions')
export class OfficeSubscription {
  @PrimaryGeneratedColumn('identity')
  id: bigint;

  @ManyToOne(() => OfficeProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'office_id' })
  office: OfficeProfile;

  @ManyToOne(() => SubscriptionPlan, (plan) => plan.subscriptions, {
    eager: true,
  })
  @JoinColumn({ name: 'plan_id' })
  plan: SubscriptionPlan;

  @CreateDateColumn()
  startDate: Date;

  @Column({ type: 'timestamp' })
  endDate: Date;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE,
  })
  status: SubscriptionStatus;
}
