import { Account } from "src/module/account/entity/account.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { ReviewOfficeStatus } from "../enum/review-office-status.enum";
import { OfficeEmployee } from "./employee.entity";

@Entity('office_profiles')
export class OfficeProfile {

  @PrimaryGeneratedColumn({ name: 'account_id', type: 'bigint' })
  accountId: bigint;

  @OneToOne(() => Account, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'account_id' })
  account: Account;

  @Column()
  officeName: string;

  @Column({ nullable: true })
  commerceNumber: string;

  @Column({ nullable: true })
  taxCertificate: string;

  @Column({ nullable: true })
  logoUrl: string;

  @Column({
    type: 'enum',
    enum: ReviewOfficeStatus,
    default: ReviewOfficeStatus.PENDING
  })
  reviewStatus: ReviewOfficeStatus;

  @Column({ nullable: true })
  rejectionReason: string;

  @OneToMany(() => OfficeEmployee, (employee) => employee.office)
  employees: OfficeEmployee[];
}