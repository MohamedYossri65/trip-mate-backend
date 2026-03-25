import { Account } from 'src/module/account/entity/account.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { OfficeProfile } from './office.entity';

@Entity('office_employees')
@Unique(['accountId'])
export class OfficeEmployee {

  @PrimaryGeneratedColumn('identity')
  id: bigint;

  @ManyToOne(() => OfficeProfile, { onDelete: 'CASCADE' })
  @JoinColumn()
  office: OfficeProfile;

  @Column({ name: 'account_id', type: 'bigint', nullable: true })
  accountId: bigint | null;

  @ManyToOne(() => Account, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'account_id' })
  account: Account | null;

  @Column()
  name: string;

  @Column()
  phone: string;

  @Column()
  roleInOffice: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ name: 'invited_by_account_id', type: 'bigint', nullable: true })
  invitedByAccountId: bigint | null;

  @CreateDateColumn({ name: 'invited_at' })
  invitedAt: Date;
}