import { OfficeSubscription } from '../entity/office-subscription.entity';
import { SubscriptionStatus } from '../enum/subscription-status.enum';
import { SubscriptionPlanMapper } from './subscription-plan.mapper';

export class OfficeSubscriptionMapper {
  id: string;
  plan: SubscriptionPlanMapper;
  startDate: Date;
  endDate: Date;
  status: SubscriptionStatus;
  testingPeriod: boolean;

  static fromEntity(
    subscription: OfficeSubscription,
  ): OfficeSubscriptionMapper {
    return {
      id: subscription.id.toString(),
      plan: SubscriptionPlanMapper.fromEntity(subscription.plan),
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      status: subscription.status,
      testingPeriod: subscription.testingPeriod,
    };
  }

  static fromEntities(
    subscriptions: OfficeSubscription[],
  ): OfficeSubscriptionMapper[] {
    return subscriptions.map(OfficeSubscriptionMapper.fromEntity);
  }
}
