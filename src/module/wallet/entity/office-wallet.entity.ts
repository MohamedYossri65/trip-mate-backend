import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Account } from '../../account/entity/account.entity';
import { WalletTransaction } from './wallet-transaction.entity';

@Entity('office_wallets')
export class OfficeWallet {
  @PrimaryGeneratedColumn('identity')
  id: bigint;

  @Column({ name: 'office_account_id', type: 'bigint', unique: true })
  officeAccountId: bigint;

  @OneToOne(() => Account)
  @JoinColumn({ name: 'office_account_id' })
  officeAccount: Account;

  @Column({ name: 'available_balance', type: 'decimal', precision: 12, scale: 2, default: 0 })
  availableBalance: number;

  @Column({ name: 'pending_balance', type: 'decimal', precision: 12, scale: 2, default: 0 })
  pendingBalance: number;

  @Column({ default: 'SAR' })
  currency: string;

  @OneToMany(() => WalletTransaction, (tx) => tx.wallet)
  transactions: WalletTransaction[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
