import { Account } from "src/module/account/entity/account.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { ReviewOfficeStatus } from "../enum/review-office-status.enum";
import { OfficeProfile } from "./office.entity";

@Entity('office_employees')
export class OfficeEmployee {

  @PrimaryGeneratedColumn('identity')
  id: bigint;

  @ManyToOne(() => OfficeProfile, { onDelete: 'CASCADE' })
  @JoinColumn()
  office: OfficeProfile;

  @Column()
  name: string;

  @Column()
  phone: string;

  @Column()
  roleInOffice: string;
}