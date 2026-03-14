import { Entity, Column, PrimaryColumn, OneToOne, JoinColumn, ManyToOne } from 'typeorm';
import { BundleBase } from './bundle-base.entity';

@Entity('car_bundles')
export class CarBundle {
    @PrimaryColumn({ name: 'bundle_base_id', type: 'bigint' })
    bundleBaseId: bigint;

    @ManyToOne(() => BundleBase, { eager: true })
    @JoinColumn({ name: 'bundle_base_id' })
    bundleBase: BundleBase;

    @Column()
    deliveryLocation: string;

    @Column({ type: 'date' })
    deliveryDate: Date;

    @Column({ type: 'date' })
    returnDate: Date;

    @Column()
    carType: string;

    @Column()
    transmissionType: string;

    @Column({ nullable: true })
    carBrand?: string;

    @Column({ nullable: true })
    carModel?: string;

    @Column({ default: false })
    hasDrivingLicense: boolean;

    @Column('int')
    driverAge: number;

    @Column({ type: 'int', nullable: true })
    drivingExperienceYears: number | null;

    @Column({ default: false })
    requiresPrivateDriver: boolean;

    @Column({ default: false })
    requiresChildSeat: boolean;

    @Column({ default: false })
    requiresFullInsurance: boolean;

    @Column({ nullable: true })
    notes?: string;
}
