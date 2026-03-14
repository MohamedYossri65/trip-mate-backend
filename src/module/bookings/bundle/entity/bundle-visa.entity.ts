import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn, ManyToOne } from 'typeorm';
import { BundleBase } from './bundle-base.entity';
import { Booking } from '../../domain/entity/booking.entity';

@Entity('visa_bundles')
export class VisaBundle {
    @PrimaryColumn({ name: 'bundle_base_id', type: 'bigint' })
    bundleBaseId: bigint;

    @ManyToOne(() => BundleBase, { eager: true })
    @JoinColumn({ name: 'bundle_base_id' })
    bundleBase: BundleBase;

    @Column({ nullable: true })
    depretureCountry?: string;

    @Column()
    arrivalCountry: string;

    @Column()
    visaType: string;

    @Column({ type: 'date' })
    departureDate: Date;

    @Column({ type: 'timestamptz', nullable: true })
    returnDate: Date | null;

}
