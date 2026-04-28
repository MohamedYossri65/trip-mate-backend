import { OfficeProfile } from "src/module/office/entity/office.entity";
import { OfficeSubscriptionMapper } from "src/module/subscription/mapper/office-subscription.mapper";

export class GetMeOfficeResponse {
    accountId: bigint;
    email: string;
    phone: string;
    role: string;
    status: string;
    officeName: string;
    commerceNumber: string;
    taxCertificate: string;
    logoUrl: string;
    reviewStatus: string;
    rejectionReason: string;
    isEmployee: boolean;
    employees: {
        id: bigint;
        name: string;
        phone: string;
        roleInOffice: string;
    }[];
    permissions: any;
    testingPeriod: boolean | null;

    static fromEntities(account: any, officeProfile: any, isEmployee: boolean, office: OfficeProfile | null, activeSubscription: OfficeSubscriptionMapper | null, permissions?: any): GetMeOfficeResponse {
        return {
            accountId: account.id,
            email: account.email,
            phone: account.phone,
            role: account.role,
            status: account.status,
            officeName: office?.officeName || "",
            commerceNumber: office?.commerceNumber || "",
            taxCertificate: office?.taxCertificate || "",
            logoUrl: office?.logoUrl || "",
            reviewStatus: officeProfile?.reviewStatus || null,
            rejectionReason: officeProfile?.rejectionReason || null,
            isEmployee: isEmployee ?? false,
            employees: (officeProfile?.employees || []).map((emp: any) => ({
                id: emp.id,
                name: emp.name,
                phone: emp.phone,
                roleInOffice: emp.roleInOffice,
            })),
            permissions: permissions || null,
            testingPeriod: activeSubscription?.testingPeriod || null,
        };
    }
}
