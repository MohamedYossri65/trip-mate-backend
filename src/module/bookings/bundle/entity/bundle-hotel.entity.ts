import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn, ManyToOne } from 'typeorm';
import { BundleBase } from './bundle-base.entity';
import { RoomDetail } from 'src/module/offers/entity/hotel-offer-details';

@Entity('hotel_bundles')
export class HotelBundle {
    @PrimaryColumn({ name: 'bundle_base_id', type: 'bigint' })
    bundleBaseId: bigint;

    @ManyToOne(() => BundleBase, { eager: true })
    @JoinColumn({ name: 'bundle_base_id' })
    bundleBase: BundleBase;

    @Column({ default: false })
    isTherePreferredHotel: boolean;

    @Column({ length: 200, nullable: true })
    hotelName?: string;

    @Column({ type: 'smallint' })
    starRating: number;

    @Column({ type: 'jsonb' })
    roomDetails: RoomDetail[];

    @Column({ type: 'text', nullable: true })
    notes?: string;

}
