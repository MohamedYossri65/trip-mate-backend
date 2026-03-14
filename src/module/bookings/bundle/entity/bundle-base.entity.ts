

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    OneToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    PrimaryColumn,
} from 'typeorm';
import { Booking } from '../../domain/entity/booking.entity';

@Entity('bundle-base')
export class BundleBase {
    @PrimaryColumn({ name: 'booking_id', type: 'bigint' })
    bookingId: bigint;

    @OneToOne(() => Booking, { onDelete: 'CASCADE', eager: true })
    @JoinColumn({ name: 'booking_id' })
    booking: Booking;

    @Column()
    fingerPrintLocation: string;

    @Column('int')
    companionsAdults: number;

    @Column('int')
    companionsChildren: number;

    @Column({ type: 'int' ,default: 1})
    numberOfTrips: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

}