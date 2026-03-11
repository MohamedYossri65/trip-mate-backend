import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PlanFeature } from './plan-feature.entity';
import { OfficeSubscription } from './office-subscription.entity';

@Entity('subscription_plans')
export class SubscriptionPlan {
  @PrimaryGeneratedColumn('identity')
  id: bigint;

  @Column()
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column()
  durationInDays: number;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => PlanFeature, (planFeature) => planFeature.plan, {
    cascade: true,
    eager: true,
  })
  planFeatures: PlanFeature[];

  @OneToMany(() => OfficeSubscription, (sub) => sub.plan)
  subscriptions: OfficeSubscription[];
}
