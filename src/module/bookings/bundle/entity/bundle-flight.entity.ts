import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, ManyToOne } from 'typeorm';
import { BundleBase } from './bundle-base.entity';

@Entity('flight_bundles')
export class FlightBundle {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: bigint;

    @Column({ name: 'bundle_base_id', type: 'bigint' })
    bundleBaseId: bigint;

    @ManyToOne(() => BundleBase, { eager: true })
    @JoinColumn({ name: 'bundle_base_id' })
    bundleBase: BundleBase;

    @Column()
    ticketGrade: string;

}
