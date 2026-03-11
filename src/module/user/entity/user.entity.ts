import { Account } from "src/module/account/entity/account.entity";
import { Review } from "src/module/review/entity/review.entity";
import { Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryColumn } from "typeorm";

@Entity('user_profiles')
export class UserProfile {

  @PrimaryColumn({ name: 'account_id', type: 'bigint' })
  accountId: bigint;

  @OneToOne(() => Account, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'account_id' })
  account: Account;

  @Column()
  name: string;

  @OneToMany(() => Review, (review) => review.userProfile)
  reviews: Review[];
}