import { Account } from "src/module/account/entity/account.entity";
import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from "typeorm";

@Entity('user_profiles')
export class UserProfile {

  @PrimaryColumn({ name: 'account_id', type: 'bigint' })
  accountId: bigint;

  @OneToOne(() => Account, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'account_id' })
  account: Account;

  @Column()
  name: string;
}