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

    static fromEntities(account: any, officeProfile: any, isEmployee: boolean, permissions?: any): GetMeOfficeResponse {
        return {
            accountId: account.id,
            email: account.email,
            phone: account.phone,
            role: account.role,
            status: account.status,
            officeName: officeProfile?.officeName || null,
            commerceNumber: officeProfile?.commerceNumber || null,
            taxCertificate: officeProfile?.taxCertificate || null,
            logoUrl: officeProfile?.logoUrl || null,
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
        };
    }
}
