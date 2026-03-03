import { Entity, PrimaryGeneratedColumn, Column, PrimaryColumn, OneToOne, JoinColumn } from 'typeorm';
import { Booking } from '../../../domain/entity/booking.entity';

@Entity('car_bookings')
export class CarBooking {
    @PrimaryColumn({ name: 'booking_id', type: 'bigint' })
    bookingId: bigint;

    @OneToOne(() => Booking, { onDelete: 'CASCADE', eager: true })
    @JoinColumn({ name: 'booking_id' })
    booking: Booking;

    @Column()
    arrivalCountry: string;

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
