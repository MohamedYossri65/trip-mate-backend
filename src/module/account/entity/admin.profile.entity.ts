import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Account } from './account.entity';

@Entity('admin_profiles')
export class AdminProfile {
    @PrimaryGeneratedColumn('identity')
    id!: bigint;


    @Column({ nullable: true })
    profilePicture!: string;

    @Column({ unique: true, nullable: true })
    name!: string;

    @Column({ length: 10, default: 'ar' })
    language!: string;

    @Column({ nullable: true })
    accountId!: bigint;

    @ManyToOne(() => Account, { nullable: false, eager: true })
    @JoinColumn({ name: 'accountId' })
    account!: Account;
}
