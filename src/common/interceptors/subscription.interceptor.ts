import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  ForbiddenException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { SubscriptionService } from '../../module/subscription/subscription.service';
import { SUBSCRIPTION_FEATURE_KEY } from '../guards/decorators/subscription-feature.decorator';
import { FeatureCode } from '../../module/subscription/enum/feature-code.enum';
import { RolesEnum } from '../enums/roles.enum';
import { SubscriptionStatus } from '../../module/subscription/enum/subscription-status.enum';
import { IS_PUBLIC_KEY } from '../guards/decorators/public.decorator';

@Injectable()
export class SubscriptionInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const requiredFeature = this.reflector.getAllAndOverride<FeatureCode>(
      SUBSCRIPTION_FEATURE_KEY,
      [context.getHandler(), context.getClass()],
    );

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return next.handle();
    }

    if (user.role !== RolesEnum.OFFICE) {
      return next.handle();
    }

    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isPublic) {
      return next.handle();
    }

    const status = await this.subscriptionService.checkSubscriptionStatus(
      user.id,
    );

    if (status === SubscriptionStatus.EXPIRED) {
      throw new ForbiddenException('Subscription expired');
    }

    // If no @SubscriptionFeature decorator, allow access
    if (!requiredFeature) {
      return next.handle();
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

    return next.handle();
  }
}
