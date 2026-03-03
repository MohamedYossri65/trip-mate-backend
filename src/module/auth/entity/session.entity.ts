import { Account } from "src/module/account/entity/account.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn('identity')
  id: bigint;

  @ManyToOne(() => Account, (account) => account.sessions, {
    onDelete: 'CASCADE',
  })
  account: Account;

  @Column()
  refreshTokenHash: string;

  @Column()
  deviceName: string; // Chrome Windows

  @Column()
  ipAddress: string;

  @Column()
  userAgent: string;

  @Column({ default: false })
  isRevoked: boolean;

  @Column()
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}