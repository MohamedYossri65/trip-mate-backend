import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { SubscriptionPlan } from './entity/subscription-plan.entity';
import { Feature } from './entity/feature.entity';
import { PlanFeature } from './entity/plan-feature.entity';
import { OfficeSubscription } from './entity/office-subscription.entity';
import { CreatePlanDto } from './dto/create-plan.dto';
import { SubscriptionStatus } from './enum/subscription-status.enum';
import { FeatureCode } from './enum/feature-code.enum';
import { OfficeEmployee } from '../office/entity/employee.entity';
import { SubscriptionPlanMapper } from './mapper/subscription-plan.mapper';
import { OfficeSubscriptionMapper } from './mapper/office-subscription.mapper';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(SubscriptionPlan)
    private readonly planRepository: Repository<SubscriptionPlan>,

    @InjectRepository(Feature)
    private readonly featureRepository: Repository<Feature>,

    @InjectRepository(PlanFeature)
    private readonly planFeatureRepository: Repository<PlanFeature>,

    @InjectRepository(OfficeSubscription)
    private readonly officeSubscriptionRepository: Repository<OfficeSubscription>,

    @InjectRepository(OfficeEmployee)
    private readonly officeEmployeeRepository: Repository<OfficeEmployee>,

    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) { }

  // ─── Admin: Create a subscription plan ────────────────────────
  async createPlan(dto: CreatePlanDto): Promise<SubscriptionPlanMapper> {
    const plan = this.planRepository.create({
      name: dto.name,
      price: dto.price,
      durationInDays: dto.durationInDays,
    });

    const savedPlan = await this.planRepository.save(plan);

    const planFeatures: PlanFeature[] = [];

    for (const featureDto of dto.features) {
      let feature = await this.featureRepository.findOne({
        where: { code: featureDto.featureCode },
      });

      if (!feature) {
        // Auto-create the feature with the admin-provided name
        feature = await this.featureRepository.save(
          this.featureRepository.create({
            code: featureDto.featureCode,
            name: featureDto.name,
          }),
        );
      } else {
        // Update the feature name if provided
        feature.name = featureDto.name || feature.name;
        await this.featureRepository.save(feature);
      }

      const planFeature = this.planFeatureRepository.create({
        plan: savedPlan,
        feature,
        enabled: featureDto.enabled,
        limitValue: featureDto.limitValue ?? null,
      });

      planFeatures.push(planFeature);
    }

    await this.planFeatureRepository.save(planFeatures);

    const finalPlan = await this.planRepository.findOneOrFail({
      where: { id: savedPlan.id },
      relations: ['planFeatures', 'planFeatures.feature'],
    });

    return SubscriptionPlanMapper.fromEntity(finalPlan);
  }

  // ─── List all plans ───────────────────────────────────────────
  async getAllPlans(): Promise<SubscriptionPlanMapper[]> {
    const plans = await this.planRepository.find({
      relations: ['planFeatures', 'planFeatures.feature'],
    });
    const getTheMostPopularPlan = await this.officeSubscriptionRepository
      .createQueryBuilder('subscription')
      .select('subscription.plan_id', 'planId')
      .addSelect('COUNT(subscription.id)', 'count')
      .groupBy('subscription.plan_id')
      .orderBy('count', 'DESC')
      .getRawOne();

    const mostPopularPlanId = getTheMostPopularPlan?.planId
      ? getTheMostPopularPlan.planId
      : undefined;

    return SubscriptionPlanMapper.fromEntities(plans, mostPopularPlanId);
  }

  // ─── Office subscribes to a plan ──────────────────────────────
  async subscribeToPlan(
    officeAccountId: bigint,
    planId: number,
  ): Promise<OfficeSubscriptionMapper> {
    const plan = await this.planRepository.findOne({
      where: { id: BigInt(planId) },
    });

    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    // Deactivate any existing active subscription
    await this.officeSubscriptionRepository.update(
      {
        office: { accountId: officeAccountId },
        status: SubscriptionStatus.ACTIVE,
      },
      { status: SubscriptionStatus.EXPIRED },
    );

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.durationInDays);

    const subscription = this.officeSubscriptionRepository.create({
      office: { accountId: officeAccountId },
      plan,
      startDate,
      endDate,
      status: SubscriptionStatus.ACTIVE,
    });

    const savedSubscription = await this.officeSubscriptionRepository.save(
      subscription,
    );

    // Invalidate cache for this office
    await this.cacheManager.del(`subscription_status_${officeAccountId}`);
    await this.cacheManager.del(`active_subscription_${officeAccountId}`);

    return OfficeSubscriptionMapper.fromEntity(savedSubscription);
  }

  // ─── Get active subscription for an office ────────────────────
  async getActiveSubscription(
    officeAccountId: bigint,
  ): Promise<OfficeSubscriptionMapper | null> {
    const cacheKey = `active_subscription_${officeAccountId}`;

    // Try to get from cache
    const cached = await this.cacheManager.get<OfficeSubscriptionMapper>(cacheKey);
    if (cached) {
      return cached;
    }

    const subscription = await this.officeSubscriptionRepository.findOne({
      where: {
        office: { accountId: officeAccountId },
        status: SubscriptionStatus.ACTIVE,
      },
      relations: ['plan', 'plan.planFeatures', 'plan.planFeatures.feature'],
    });

    const result = subscription ? OfficeSubscriptionMapper.fromEntity(subscription) : null;

    // Cache the result with TTL
    let ttl = 3600; // Default 1 hour
    if (subscription) {
      // Cache until subscription ends
      ttl = Math.floor(
        (subscription.endDate.getTime() - Date.now()) / 1000,
      );
      // Ensure minimum TTL of 60 seconds
      ttl = Math.max(ttl, 60);
    }

    await this.cacheManager.set(cacheKey, result, ttl);

    return result;
  }

  // ─── Check if a feature is enabled for the office ─────────────
  async checkFeatureAccess(
    officeAccountId: bigint,
    featureCode: FeatureCode,
  ): Promise<boolean> {
    const subscription = await this.getActiveSubscription(officeAccountId);

    if (!subscription) {
      return false;
    }

    const planFeature = subscription.plan.features.find(
      (pf) => pf.featureCode === featureCode,
    );

    return planFeature?.enabled ?? false;
  }

  // ─── Get the limit value for a feature ────────────────────────
  async getFeatureLimit(
    officeAccountId: bigint,
    featureCode: FeatureCode,
  ): Promise<number | null> {
    const subscription = await this.getActiveSubscription(officeAccountId);

    if (!subscription) {
      return 0;
    }

    const planFeature = subscription.plan.features.find(
      (pf) => pf.featureCode === featureCode,
    );

    if (!planFeature || !planFeature.enabled) {
      return 0;
    }

    return planFeature.limitValue; // null means unlimited
  }

  // ─── Check if office can create more employees ────────────────
  async canCreateMoreEmployees(officeAccountId: bigint): Promise<void> {
    const featureEnabled = await this.checkFeatureAccess(
      officeAccountId,
      FeatureCode.EMPLOYEE_ACCOUNTS,
    );

    if (!featureEnabled) {
      throw new ForbiddenException(
        'Your subscription plan does not allow creating employee accounts',
      );
    }

    const limit = await this.getFeatureLimit(
      officeAccountId,
      FeatureCode.EMPLOYEE_ACCOUNTS,
    );

    // null means unlimited
    if (limit === null) {
      return;
    }

    const currentCount = await this.officeEmployeeRepository.count({
      where: { office: { accountId: officeAccountId } },
    });

    if (currentCount >= limit) {
      throw new ForbiddenException(
        `Employee limit reached. Your plan allows a maximum of ${limit} employees`,
      );
    }
  }

  // ─── Enforce feature access (used by guard) ───────────────────
  async enforceFeatureAccess(
    officeAccountId: bigint,
    featureCode: FeatureCode,
  ): Promise<void> {
    const hasAccess = await this.checkFeatureAccess(
      officeAccountId,
      featureCode,
    );

    if (!hasAccess) {
      throw new ForbiddenException(
        `Your subscription plan does not include the "${featureCode}" feature`,
      );
    }
  }

  // ─── Check subscription status with daily cache ───────────────
  async checkSubscriptionStatus(
    officeAccountId: bigint,
  ): Promise<SubscriptionStatus> {

    const cacheKey = `subscription_status_${officeAccountId}`;

    const cached = await this.cacheManager.get<SubscriptionStatus>(cacheKey);
    if (cached) {
      return cached;
    }

    const subscription = await this.officeSubscriptionRepository.findOne({
      where: {
        office: { accountId: officeAccountId },
        status: SubscriptionStatus.ACTIVE,
      },
    });

    let status = SubscriptionStatus.EXPIRED;
    let ttl = 3600;

    if (subscription) {

      if (subscription.endDate < new Date()) {
        subscription.status = SubscriptionStatus.EXPIRED;
        await this.officeSubscriptionRepository.save(subscription);
      } else {
        status = SubscriptionStatus.ACTIVE;

        ttl = Math.floor(
          (subscription.endDate.getTime() - Date.now()) / 1000,
        );
      }
    }

    await this.cacheManager.set(cacheKey, status, ttl);

    return status;
  }
}
