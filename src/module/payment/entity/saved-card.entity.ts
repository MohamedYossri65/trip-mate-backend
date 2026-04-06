import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Account } from '../../account/entity/account.entity';

@Entity('saved_cards')
export class SavedCard {
  @PrimaryGeneratedColumn('identity')
  id: bigint;

  @ManyToOne(() => Account, { nullable: false })
  @JoinColumn({ name: 'account_id' })
  account: Account;

  @Column({ name: 'tap_card_id', unique: true })
  tapCardId: string;

  @Column({ name: 'tap_customer_id', nullable: true })
  tapCustomerId: string;

  @Column({ name: 'card_brand' })
  cardBrand: string;

  @Column({ name: 'last_four' })
  lastFour: string;

  @Column({ name: 'first_six', nullable: true })
  firstSix: string;

  @Column({ name: 'expiry_month', nullable: true })
  expiryMonth: string;

  @Column({ name: 'expiry_year', nullable: true })
  expiryYear: string;

  @Column({ name: 'cardholder_name', nullable: true })
  cardholderName: string;

  @Column({ name: 'is_default', default: false })
  isDefault: boolean;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
