import { Account } from "src/module/account/entity/account.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, OneToMany, OneToOne, PrimaryColumn } from "typeorm";
import { ReviewOfficeStatus } from "../enum/review-office-status.enum";
import { OfficeEmployee } from "./employee.entity";
import { Review } from "src/module/review/entity/review.entity";

export interface OfficeChangeRequestData {
  officeName?: string;
  phoneNumber?: string;
  email?: string;
  commerceNumber?: string;
  commerceCertificate?: string;
  taxCertificate?: string;
}

@Entity('office_profiles')
export class OfficeProfile {

  @PrimaryColumn({ name: 'account_id', type: 'bigint' })
  accountId: bigint;

  @OneToOne(() => Account, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'account_id' })
  account: Account;

  @Column()
  officeName: string;

  @Column({ nullable: true ,default: 'الرياض'})
  location: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  commerceNumber: string;

    @Column({
		nullable: true,
		transformer: {
			to: (value: string) => value,
			from: (value: string) => {
				const baseUrl = process.env.IMAGEKIT_URL_ENDPOINT || 'https://yourbaseurl.com';
				if (!value) return value;
				if (value.startsWith('http://') || value.startsWith('https://')) {
					return value.replace(/^(http:\/\/|https:\/\/)[^\/]+/, baseUrl);
				}
				return `${baseUrl}${value}`;
			},
		},
	})
  taxCertificate: string;

  @Column({
		nullable: true,
		transformer: {
			to: (value: string) => value,
			from: (value: string) => {
				const baseUrl = process.env.IMAGEKIT_URL_ENDPOINT || 'https://yourbaseurl.com';
				if (!value) return value;
				if (value.startsWith('http://') || value.startsWith('https://')) {
					return value.replace(/^(http:\/\/|https:\/\/)[^\/]+/, baseUrl);
				}
				return `${baseUrl}${value}`;
			},
		},
	})
  logoUrl: string;

  @Column({
    type: 'enum',
    enum: ReviewOfficeStatus,
    default: ReviewOfficeStatus.PENDING
  })
  reviewStatus: ReviewOfficeStatus;

  @Column({ nullable: true })
  rejectionReason: string;

  @Column({
    name: 'change_request_status',
    nullable: true,
  })
  changeRequestStatus: ReviewOfficeStatus;

  @Column({ name: 'change_request_data', type: 'simple-json', nullable: true })
  changeRequestData: OfficeChangeRequestData | null;

  @Column({ name: 'change_request_rejection_reason', nullable: true })
  changeRequestRejectionReason: string ;

  @Column({ name: 'change_request_submitted_at', type: 'timestamp', nullable: true })
  changeRequestSubmittedAt: Date | null;

  @OneToMany(() => OfficeEmployee, (employee) => employee.office)
  employees: OfficeEmployee[];

  @OneToMany(() => Review, (review) => review.office)
  reviews: Review[];
}