import { SetMetadata } from '@nestjs/common';
import { FeatureCode } from '../../../module/subscription/enum/feature-code.enum';

export const SUBSCRIPTION_FEATURE_KEY = 'subscription_feature';

export const SubscriptionFeature = (featureCode: FeatureCode) =>
  SetMetadata(SUBSCRIPTION_FEATURE_KEY, featureCode);
