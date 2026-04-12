import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BookingType } from '../../domain/enum/booking-type.enum';

@Entity('booking_settings')
export class BookingSetting {
  @PrimaryGeneratedColumn('identity')
  id!: number;

  @Column({ type: 'enum', enum: BookingType, unique: true })
  serviceType!: BookingType;

  @Column({ type: 'boolean', default: true })
  isEnabled!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
