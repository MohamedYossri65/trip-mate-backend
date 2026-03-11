import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';
import { CacheModule } from '@nestjs/cache-manager';
import { SubscriptionPlan } from './entity/subscription-plan.entity';
import { Feature } from './entity/feature.entity';
import { PlanFeature } from './entity/plan-feature.entity';
import { OfficeSubscription } from './entity/office-subscription.entity';
import { OfficeEmployee } from '../office/entity/employee.entity';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SubscriptionPlan,
      Feature,
      PlanFeature,
      OfficeSubscription,
      OfficeEmployee,
    ]),
    CacheModule.register({
      ttl: 86400000, // 1 day in milliseconds
    }),
  ],
  controllers: [SubscriptionController],
  providers: [SubscriptionService],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
