import { OfficeProfile } from "src/module/office/entity/office.entity";


export class RegisterOfficeResponse {
  accountId: bigint;
  email: string;
  phone: string;
  role: string;
  officeName: string;
  logoUrl: string;
  reviewStatus: string;

  static fromEntity(officeProfile: OfficeProfile | null): RegisterOfficeResponse {
    if (!officeProfile || !officeProfile.account) {
      throw new Error('Invalid office profile entity');
    }
    return {
      accountId: officeProfile.account.id,
      email: officeProfile.account.email,
      phone: officeProfile.account.phone,
      role: officeProfile.account.role,
      officeName: officeProfile.officeName || '',
      logoUrl: officeProfile.logoUrl || '',
      reviewStatus: officeProfile.reviewStatus || ''
    };
  }
}
