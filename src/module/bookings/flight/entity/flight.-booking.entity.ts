import { Entity, PrimaryGeneratedColumn, Column, PrimaryColumn, OneToOne, JoinColumn } from 'typeorm';
import { Booking } from '../../entity/booking.entity';

@Entity('flight_bookings')
export class FlightBooking {
    @PrimaryColumn({ name: 'booking_id', type: 'bigint' })
    bookingId: bigint;

    @OneToOne(() => Booking, { onDelete: 'CASCADE', eager: true })
    @JoinColumn({ name: 'booking_id' })
    booking: Booking;

    @Column()
    departureCountry: string;

    @Column()
    departureCity: string;

    @Column()
    arrivalCountry: string;

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
}
