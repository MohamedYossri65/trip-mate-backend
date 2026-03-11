import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
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