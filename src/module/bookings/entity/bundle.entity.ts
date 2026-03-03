import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { UserProfile } from 'src/module/user/entity/user.entity';
import { Booking } from './booking.entity';

@Entity('bundles')
export class Bundle {
  @PrimaryGeneratedColumn('identity')
  id: bigint;

  @ManyToOne(() => UserProfile, { nullable: false, eager: true })
  user: UserProfile;

  @OneToMany(() => Booking, (booking) => booking.bundle)
  bookings: Booking[];

  @CreateDateColumn()
  createdAt: Date;
}
