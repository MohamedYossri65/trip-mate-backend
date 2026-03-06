import { Entity, Column, PrimaryColumn, OneToOne, JoinColumn } from 'typeorm';
import { Offer } from './offer.entity';

@Entity('flight_offer_details')
export class FlightOfferDetails {
    @PrimaryColumn({ name: 'offer_id', type: 'bigint' })
    offerId: bigint;

    @OneToOne(() => Offer, { onDelete: 'CASCADE', eager: true })
    @JoinColumn({ name: 'offer_id' })
    offer: Offer;

    @Column()
    departureCountry: string;

    @Column()
    departureCity: string;

    @Column()
    arrivalCity: string;

    @Column({ default: false })
    isRoundTrip: boolean;

    @Column({ type: 'date' })
    departureDate: Date;

    @Column({ type: 'date', nullable: true })
    returnDate?: Date;

    @Column({ default: false })
    hasVisa: boolean;

    @Column({ default: false })
    hasCompanions: boolean;

    @Column({ type: 'int', nullable: true })
    numberOfCompanions?: number;

    @Column()
    fullName: string;

    @Column({ type: 'date' })
    dateOfBirth: Date;

    @Column()
    nationalIdNumber: string;

    @Column()
    nationality: string;

    @Column({ default: false })
    hasPassport: boolean;

    @Column({ default: false })
    isYouTravelToThisCountryBefore: boolean;

    @Column({ default: false })
    isYourVisaRefusedBefore: boolean;

    @Column({ nullable: true })
    notes?: string;
}
