import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Account } from 'src/module/account/entity/account.entity';
import { DeviceType } from '../enums';

@Entity('user_devices')
export class UserDevice {
  @PrimaryGeneratedColumn('identity')
  id: number;

  @Column({ name: 'account_id', type: 'bigint' })
  accountId: bigint;

  @ManyToOne(() => Account, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'account_id' })
  account: Account;

  @Column({ name: 'device_token', unique: true })
  deviceToken: string;

  @Column({ name: 'device_type', type: 'enum', enum: DeviceType })
  deviceType: DeviceType;

  @Column({ name: 'app_version', nullable: true })
  appVersion: string;

  @Column({ name: 'last_seen', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  lastSeen: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
