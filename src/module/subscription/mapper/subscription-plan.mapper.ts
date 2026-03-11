import { SubscriptionPlan } from '../entity/subscription-plan.entity';
import { PlanFeatureMapper } from './plan-feature.mapper';

export class SubscriptionPlanMapper {
  id: string;
  name: string;
  price: number;
  durationInDays: number;
  features: PlanFeatureMapper[];
  isMostPopular?: boolean;
  createdAt: Date;

  static fromEntity(
    plan: SubscriptionPlan,
    isMostPopular: boolean = false,
  ): SubscriptionPlanMapper {
    return {
      id: plan.id.toString(),
      name: plan.name,
      price: plan.price,
      durationInDays: plan.durationInDays,
      features: PlanFeatureMapper.fromEntities(plan.planFeatures || []),
      isMostPopular,
      createdAt: plan.createdAt,
    };
  }

  static fromEntities(
    plans: SubscriptionPlan[],
    mostPopularPlanId?: bigint,
  ): SubscriptionPlanMapper[] {
    return plans.map((plan) =>
      SubscriptionPlanMapper.fromEntity(plan, plan.id === mostPopularPlanId),
    );
  }
}
