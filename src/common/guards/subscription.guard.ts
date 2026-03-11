import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SubscriptionService } from '../../module/subscription/subscription.service';
import { SUBSCRIPTION_FEATURE_KEY } from './decorators/subscription-feature.decorator';
import { FeatureCode } from '../../module/subscription/enum/feature-code.enum';
import { RolesEnum } from '../enums/roles.enum';
import { SubscriptionStatus } from 'src/module/subscription/enum/subscription-status.enum';
import { IS_PUBLIC_KEY } from './decorators/public.decorator';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly subscriptionService: SubscriptionService,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredFeature = this.reflector.getAllAndOverride<FeatureCode>(
      SUBSCRIPTION_FEATURE_KEY,
      [context.getHandler(), context.getClass()],
    );

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if(!user) {
      return true; // Allow access if no user (e.g., public route)
    }

    if (user.role !== RolesEnum.OFFICE) {
      return true;
    }


    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isPublic) {
      return true;
    }

    const status = await this.subscriptionService.checkSubscriptionStatus(
      user.accountId
    );

    if (status === SubscriptionStatus.EXPIRED) {
      throw new ForbiddenException('Subscription expired');
    }

    // If no @SubscriptionFeature decorator, allow access
    if (!requiredFeature) {
      return true;
    }

    // Only enforce on OFFICE role
    if (!user || user.role !== RolesEnum.OFFICE) {
      return true;
    }

    const hasAccess = await this.subscriptionService.checkFeatureAccess(
      user.id,
      requiredFeature,
    );

    if (!hasAccess) {
      throw new ForbiddenException(
        `Your subscription plan does not include the "${requiredFeature}" feature`,
      );
    }

    return true;
  }
}
