import { AccountStatus } from "src/common/enums/account-status.enum";
import { RolesEnum } from "src/common/enums/roles.enum";
import { Account } from "src/module/account/entity/account.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('user_profiles')
export class UserProfile {

  @PrimaryGeneratedColumn('identity')
  id: bigint;

  @OneToOne(() => Account, { onDelete: 'CASCADE' , eager : true})
  @JoinColumn()
  account: Account;

  @Column()
  name: string;
}