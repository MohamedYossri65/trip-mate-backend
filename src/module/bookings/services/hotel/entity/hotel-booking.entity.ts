import {
  Entity,
  PrimaryColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Booking } from '../../../domain/entity/booking.entity';

export interface RoomDetail {
  roomType: string;
  accommodationType: string;
}

@Entity('hotel_bookings')
export class HotelBooking {
  @PrimaryColumn({ name: 'booking_id', type: 'bigint' })
  bookingId: bigint;

  @OneToOne(() => Booking, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @Column({ length: 100 })
  destinationCountry: string;

  @Column({ length: 100 })
  destinationCity: string;

  @Column({ default: false })
  isTherePreferredHotel: boolean;

  @Column({ length: 200, nullable: true })
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