import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SubscriptionPlan } from './subscription-plan.entity';
import { Feature } from './feature.entity';

@Entity('plan_features')
export class PlanFeature {
  @PrimaryGeneratedColumn('identity')
  id: bigint;

  @ManyToOne(() => SubscriptionPlan, (plan) => plan.planFeatures, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'plan_id' })
  plan: SubscriptionPlan;

  @ManyToOne(() => Feature, (feature) => feature.planFeatures, {
    eager: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'feature_id' })
  feature: Feature;

  @Column({ default: false })
  enabled: boolean;

  @Column({ nullable: true, type: 'int' })
  limitValue: number | null;
}
