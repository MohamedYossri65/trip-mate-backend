import { Account } from 'src/module/account/entity/account.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Index,
  CreateDateColumn,
} from 'typeorm';
import { OtpPurpose } from '../enum/otp-purpose.enum';
import { OtpStatus } from '../enum/otp-status.enum';



@Entity('otps')
@Index(['accountId', 'purpose'])
export class Otp {

  @PrimaryGeneratedColumn('identity')
  id: bigint;

  @Column()
  accountId: bigint;

  @ManyToOne(() => Account, account => account.otps, {
    onDelete: 'CASCADE',
  })
  account: Account;

  // store hashed code (never store plain)
  @Column()
  codeHash: string;

  @Column({
    type: 'enum',
    enum: OtpPurpose,
  })
  purpose: OtpPurpose;

  @Column({
    type: 'enum',
    enum: OtpStatus,
    default: OtpStatus.PENDING,
  })
  status: OtpStatus;

  @Column()
  expiresAt: Date;

  @Column({ default: 0 })
  attempts: number;

  @Column({ default: 5 })
  maxAttempts: number;

  @CreateDateColumn()
  createdAt: Date;
}