// src/modules/offers/offer.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Booking } from '../../bookings/domain/entity/booking.entity';
import { OfficeProfile } from '../../office/entity/office.entity';
import { OfferStatus } from '../enum/offer-status.enum';


@Entity('offers')
export class Offer {
  @PrimaryGeneratedColumn('identity')
  id: bigint;

  @ManyToOne(() => Booking, { nullable: false })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @ManyToOne(() => OfficeProfile, { nullable: false })
  @JoinColumn({ name: 'office_id' })
  office: OfficeProfile;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price: number;

  @Column({ default: 'USD' })
  currency: string;

  @Column()
  arrivalCountry: string;

  @Column({
    type: 'enum',
    enum: OfferStatus,
    default: OfferStatus.PENDING,
  })
  status: OfferStatus;

  @Column({ type: 'timestamptz', nullable: true })
  offerDuration: Date;

  @Column({ type: 'text', nullable: true })
  addtionalInfo?: string;

  @Column({ type: 'jsonb', nullable: true })
  attachments: string[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}