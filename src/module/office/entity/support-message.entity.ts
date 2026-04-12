import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { OfficeProfile } from './office.entity';

@Entity('support_messages')
export class SupportMessage {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: bigint;

  @Column({ type: 'bigint' })
  officeAccountId: bigint;

  @ManyToOne(() => OfficeProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'office_account_id' })
  office: OfficeProfile;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column()
  phone: string;

  @Column({ type: 'text' })
  message: string;

  @CreateDateColumn()
  createdAt: Date;
}
