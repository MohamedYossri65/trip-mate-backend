import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { FeatureCode } from '../enum/feature-code.enum';
import { PlanFeature } from './plan-feature.entity';

@Entity('features')
export class Feature {
  @PrimaryGeneratedColumn('identity')
  id: bigint;

  @Column({
    type: 'enum',
    enum: FeatureCode,
    unique: true,
  })
  code: FeatureCode;

  @Column()
  name: string;

  @OneToMany(() => PlanFeature, (planFeature) => planFeature.feature)
  planFeatures: PlanFeature[];
}
