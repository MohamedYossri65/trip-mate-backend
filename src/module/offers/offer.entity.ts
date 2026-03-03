// src/modules/offers/offer.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Booking } from '../bookings/entity/booking.entity';
import { OfficeProfile } from '../office/entity/office.entity';
import { OfferStatus } from './enum/offer-status.enum';


@Entity('offers')
export class Offer {
  @PrimaryGeneratedColumn('identity')
  id: bigint;

  @ManyToOne(() => Booking, { nullable: false })
  booking: Booking;

  @ManyToOne(() => OfficeProfile, { nullable: false })
  office: OfficeProfile;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price: number;

  @Column({ default: 'USD' })
  currency: string;

  @Column({
    type: 'enum',
    enum: OfferStatus,
    default: OfferStatus.PENDING,
  })
  status: OfferStatus;

  @CreateDateColumn()
  createdAt: Date;
}