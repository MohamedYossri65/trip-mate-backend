import { Entity, PrimaryGeneratedColumn, Column, PrimaryColumn, OneToOne, JoinColumn } from 'typeorm';
import { Offer } from './offer.entity';

@Entity('car_offer_details')
export class CarOfferDetails {
    @PrimaryColumn({ name: 'offer_id', type: 'bigint' })
    offerId: bigint;

    @OneToOne(() => Offer, { onDelete: 'CASCADE', eager: true })
    @JoinColumn({ name: 'offer_id' })
    offer:Offer;

    @Column()
    arrivalCity: string;

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
