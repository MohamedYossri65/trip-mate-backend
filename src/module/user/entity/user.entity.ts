import { AccountStatus } from "src/common/enums/account-status.enum";
import { RolesEnum } from "src/common/enums/roles.enum";
import { Account } from "src/module/account/entity/account.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('user_profiles')
export class UserProfile {

  @PrimaryGeneratedColumn({ name: 'account_id', type: 'bigint' })
  accountId: bigint;

  @OneToOne(() => Account, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'account_id' })
  account: Account;

  @Column()
  name: string;
}