import { Entity, Column, PrimaryColumn, OneToOne, JoinColumn } from 'typeorm';
import { Offer } from './offer.entity';

@Entity('visa_offer_details')
export class VisaOfferDetails {
    @PrimaryColumn({ name: 'offer_id', type: 'bigint' })
    offerId: bigint;

    @OneToOne(() => Offer, { onDelete: 'CASCADE', eager: true })
    @JoinColumn({ name: 'offer_id' })
    offer: Offer;

    @Column()
    fingerPrintLocation: string;

    @Column()
    visaType: string;

    @Column({ type: 'date' })
    departureDate: Date;

    @Column('int')
    companionsAdults: number;

    @Column('int')
    companionsChildren: number;

    @Column({ nullable: true })
    notes?: string;
}
