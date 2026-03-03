import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { Booking } from '../../../domain/entity/booking.entity';

@Entity('visa_bookings')
export class VisaBooking {
    @PrimaryColumn({ name: 'booking_id', type: 'bigint' })
    bookingId: bigint;

    @OneToOne(() => Booking, { onDelete: 'CASCADE', eager: true })
    @JoinColumn({ name: 'booking_id' })
    booking: Booking;

    @Column()
    fingerPrintLocation: string;

    @Column()
    arrivalCountry: string;

    @Column()
    visaType: string;

    @Column({ type: 'date' })
    departureDate: Date;

    @Column('int')
    companionsAdults: number;

    @Column('int')
    companionsChildren: number;
}
