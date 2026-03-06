import { Entity, Column, PrimaryColumn, OneToOne, JoinColumn } from 'typeorm';
import { Offer } from './offer.entity';

@Entity('bundle_offer_details')
export class BundleOfferDetails {
    @PrimaryColumn({ name: 'offer_id', type: 'bigint' })
    offerId: bigint;

    @OneToOne(() => Offer, { onDelete: 'CASCADE', eager: true })
    @JoinColumn({ name: 'offer_id' })
    offer: Offer;

    @Column({ type: 'text', nullable: true })
    notes?: string;
}
