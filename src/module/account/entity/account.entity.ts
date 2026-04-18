import { AccountStatus } from 'src/common/enums/account-status.enum';
import { RolesEnum } from 'src/common/enums/roles.enum';
import { Session } from 'src/module/auth/entity/session.entity';
import { Otp } from 'src/module/otp/entity/otp.entity';
import { AdminRole } from 'src/module/role/entity/admin-role.entity';
import { OfficeRole } from 'src/module/role/entity/office-role.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn('identity')
  id!: bigint;

  @Column({ unique: true, nullable: true })
  email!: string;

  @Column({ unique: true, nullable: true })
  phone!: string;

  @Column()
  password!: string;

  @Column({
    type: 'enum',
    enum: RolesEnum,
  })
  role!: RolesEnum;

  @Column({
    type: 'enum',
    enum: AccountStatus,
    default: AccountStatus.CREATED,
  })
  status!: AccountStatus;

  @Column({ default: false })
  isPhoneVerified!: boolean;

  @Column({ length: 10, default: 'ar' })
  language!: string;

  @Column({ name: 'onesignal_player_id', nullable: true })
  onesignalPlayerId!: string;

  @Column({ nullable: true })
  roleId!: bigint;

  @ManyToOne(() => OfficeRole, { nullable: true, eager: false })
  @JoinColumn({ name: 'roleId' })
  assignedRole!: OfficeRole;

  @Column({ nullable: true })
  adminRoleId!: bigint;

  @ManyToOne(() => AdminRole, { nullable: true, eager: false })
  @JoinColumn({ name: 'adminRoleId' })
  assignedAdminRole!: AdminRole;

  @CreateDateColumn()
  createdAt!: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt !: Date;

  @OneToMany(() => Otp, (otp) => otp.account)
  otps!: Otp[];

  @OneToMany(() => Session, (session) => session.account)
  sessions!: Session[];

  
}
