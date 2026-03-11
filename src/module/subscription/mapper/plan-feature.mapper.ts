import { PlanFeature } from '../entity/plan-feature.entity';

export class PlanFeatureMapper {
  featureCode: string;
  featureName: string;
  enabled: boolean;
  limitValue: number | null;

  static fromEntity(planFeature: PlanFeature): PlanFeatureMapper {
    return {
      featureCode: planFeature.feature.code,
      featureName: planFeature.feature.name,
      enabled: planFeature.enabled,
      limitValue: planFeature.limitValue,
    };
  }

  static fromEntities(planFeatures: PlanFeature[]): PlanFeatureMapper[] {
    return planFeatures.map(PlanFeatureMapper.fromEntity);
  }
}
