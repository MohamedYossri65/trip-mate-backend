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
} from 'typeorm';
import { BookingType } from '../enum/booking-type.enum';
import { BookingStatus } from '../enum/booking-status.enum';
import { UserProfile } from 'src/module/user/entity/user.entity';
import { Offer } from 'src/module/offers/entity/offer.entity';
import { Review } from 'src/module/review/entity/review.entity';

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('identity')
  id: bigint;

  @ManyToOne(() => UserProfile, { nullable: false , eager : true})
  @JoinColumn({ name: 'userAccountId' })
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

  // Self-referencing: a BUNDLE-type booking is the parent of its child bookings
  @ManyToOne(() => Booking, (b) => b.children, { nullable: true, onDelete: 'SET NULL', eager: false })
  @JoinColumn({ name: 'parent_id' })
  parent?: Booking;

  @OneToMany(() => Booking, (b) => b.parent, { eager: false })
  children?: Booking[];


  @OneToOne(() => Review, (review) => review.booking, {nullable: true, eager: true })
  @JoinColumn({ name: 'reviewId' })
  review?: Review;

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