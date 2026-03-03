import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BookingType } from '../enum/booking-type.enum';
import { BookingStatus } from '../enum/booking-status.enum';
import { UserProfile } from 'src/module/user/entity/user.entity';
import { Offer } from 'src/module/offers/offer.entity';
import { Bundle } from './bundle.entity';

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('identity')
  id: bigint;

  @ManyToOne(() => UserProfile, { nullable: false , eager : true})
  user: UserProfile;

  @Column({ type: 'enum', enum: BookingType })
  type: BookingType;

  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.DRAFT,
  })
  status: BookingStatus;

  @OneToOne(() => Offer, { nullable: true })
  @JoinColumn({ name: 'selected_offer_id' })
  selectedOffer?: Offer;

  @ManyToOne(() => Bundle, (bundle) => bundle.bookings, { nullable: true, onDelete: 'SET NULL', eager: false })
  @JoinColumn({ name: 'bundle_id' })
  bundle?: Bundle;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  //  Domain method (state protection)
  changeStatus(newStatus: BookingStatus) {
    const allowedTransitions: Record<BookingStatus, BookingStatus[]> = {
      [BookingStatus.DRAFT]: [BookingStatus.WAITING_FOR_OFFERS],
      [BookingStatus.WAITING_FOR_OFFERS]: [
        BookingStatus.UNDER_NEGOTIATION,
        BookingStatus.CANCELLED,
      ],
      [BookingStatus.UNDER_NEGOTIATION]: [
        BookingStatus.OFFER_ACCEPTED,
        BookingStatus.CANCELLED,
      ],
      [BookingStatus.OFFER_ACCEPTED]: [
        BookingStatus.PARTIALLY_PAID,
        BookingStatus.CANCELLED,
      ],
      [BookingStatus.PARTIALLY_PAID]: [
        BookingStatus.CONFIRMED,
        BookingStatus.CANCELLED,
      ],
      [BookingStatus.CONFIRMED]: [
        BookingStatus.COMPLETED,
      ],
      [BookingStatus.COMPLETED]: [],
      [BookingStatus.CANCELLED]: [],
    };

    if (!allowedTransitions[this.status].includes(newStatus)) {
      throw new Error(
        `Invalid status transition from ${this.status} to ${newStatus}`,
      );
    }

    this.status = newStatus;
  }
}