import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { OfficeWallet } from './office-wallet.entity';
import { Booking } from '../../bookings/domain/entity/booking.entity';
import { WalletTransactionType } from '../enum/wallet-transaction-type.enum';
import { WalletTransactionStatus } from '../enum/wallet-transaction-status.enum';

@Entity('wallet_transactions')
export class WalletTransaction {
  @PrimaryGeneratedColumn('identity')
  id: bigint;

  @Column({ name: 'wallet_id', type: 'bigint' })
  walletId: bigint;

  @ManyToOne(() => OfficeWallet, (wallet) => wallet.transactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'wallet_id' })
  wallet: OfficeWallet;

  @Column({ type: 'enum', enum: WalletTransactionType })
  type: WalletTransactionType;

  @Column({
    type: 'enum',
    enum: WalletTransactionStatus,
    default: WalletTransactionStatus.PENDING,
  })
  status: WalletTransactionStatus;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ name: 'booking_id', type: 'bigint', nullable: true })
  bookingId: bigint;

  @ManyToOne(() => Booking, { nullable: true })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @Column({ name: 'releasable_at', type: 'timestamp', nullable: true })
  releasableAt: Date;

  @Column({ name: 'released_at', type: 'timestamp', nullable: true })
  releasedAt: Date;

  @Column({ name: 'tax_invoice_attachment', type: 'text', nullable: true })
  taxInvoiceAttachment?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
