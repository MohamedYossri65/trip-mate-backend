import { Entity, Column, PrimaryColumn, OneToOne, JoinColumn } from 'typeorm';
import { Offer } from './offer.entity';

export interface RoomDetail {
    roomType: string;
    accommodationType: string;
}

@Entity('hotel_offer_details')
export class HotelOfferDetails {
    @PrimaryColumn({ name: 'offer_id', type: 'bigint' })
    offerId: bigint;

    @OneToOne(() => Offer, { onDelete: 'CASCADE', eager: true })
    @JoinColumn({ name: 'offer_id' })
    offer: Offer;

    @Column()
    destinationCity: string;

    @Column({ default: false })
    isTherePreferredHotel: boolean;

    @Column({ nullable: true })
    hotelName?: string;

    @Column({ type: 'smallint' })
    starRating: number;

    @Column({ type: 'date' })
    checkIn: Date;

    @Column({ type: 'date' })
    checkOut: Date;

    @Column({ type: 'smallint' })
    numGuests: number;

    @Column({ type: 'smallint', default: 0 })
    numChildren: number;

    @Column({ type: 'jsonb' })
    roomDetails: RoomDetail[];

    @Column({ type: 'text', nullable: true })
    notes?: string;
}
