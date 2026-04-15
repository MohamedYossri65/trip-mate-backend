import { AdminProfile } from "src/module/account/entity/admin.profile.entity";

export class GetMeAdminResponse {
    accountId!: bigint;
    email!: string;
    phone!: string;
    role!: string;
    status!: string;
    permissions!: any;
    profilePicture!: string;
    name!: string;
    language!: string;
    isEmployee!: boolean;

    static fromEntities(account: any, adminProfile: AdminProfile | null, permissions?: any): GetMeAdminResponse {
        return {
            accountId: account.id,
            email: account.email,
            phone: account.phone,
            role: account.role,
            status: account.status,
            permissions: permissions || null,
            profilePicture: adminProfile?.profilePicture || '',
            name: adminProfile?.name || '',
            language: adminProfile?.language || 'ar',
            isEmployee: adminProfile ? true : false,
        };
    }
}
