import { Account } from 'src/module/account/entity/account.entity';
import { Booking } from 'src/module/bookings/domain/entity/booking.entity';
import { OfficeProfile } from 'src/module/office/entity/office.entity';
import { UserProfile } from 'src/module/user/entity/user.entity';
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    JoinColumn,
    OneToOne,
} from 'typeorm';

@Entity('reviews')
export class Review {

    @PrimaryGeneratedColumn('identity')
    id: bigint;

    @Column()
    accountId: bigint;

    @ManyToOne(() => UserProfile, userProfile => userProfile.reviews, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'accountId' })
    userProfile: UserProfile;
    
    @ManyToOne(() => OfficeProfile, office => office.reviews, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'officeId' })
    office: OfficeProfile;

    @Column({ nullable: true })
    bookingId: bigint;

    @OneToOne(() => Booking, booking => booking.review, {
        onDelete: 'CASCADE',
        nullable: true,
    })
    @JoinColumn({ name: 'bookingId' })
    booking: Booking;

    @Column()
    officeId: bigint;

    @Column()
    rating: number;

    @Column({ nullable: true })
    comment: string;

    @CreateDateColumn()
    createdAt: Date;
}