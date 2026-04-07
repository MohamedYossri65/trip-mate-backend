
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('payment_settings')
export class PaymentSetting {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  appCommission: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  taxValue: number;

  @Column({ type: 'boolean', default: false })
  enableNewContractAdvancePayment: boolean;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  advancePercentage: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
