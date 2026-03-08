import { AccountStatus } from 'src/common/enums/account-status.enum';
import { RolesEnum } from 'src/common/enums/roles.enum';
import { Session } from 'src/module/auth/entity/session.entity';
import { Otp } from 'src/module/otp/entity/otp.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn('identity')
  id: bigint;

  @Column({ unique: true, nullable: true })
  email: string;

  @Column({ unique: true, nullable: true })
  phone: string;

  @Column()
  password: string;

  @Column({
    type: 'enum',
    enum: RolesEnum,
  })
  role: RolesEnum;

  @Column({
    type: 'enum',
    enum: AccountStatus,
    default: AccountStatus.CREATED,
  })
  status: AccountStatus;

  @Column({ default: false })
  isPhoneVerified: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Otp, (otp) => otp.account)
  otps: Otp[];

  @OneToMany(() => Session, (session) => session.account)
  sessions: Session[];
}
