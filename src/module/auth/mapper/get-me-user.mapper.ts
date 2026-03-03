export class GetMeUserResponse {
    accountId: bigint;
    email: string;
    phone: string;
    role: string;
    status: string;
    name: string;

    static fromEntities(account: any, userProfile: any): GetMeUserResponse {
        return {
            accountId: account.id,
            email: account.email,
            phone: account.phone,
            role: account.role,
            status: account.status,
            name: userProfile?.name || null,
        };
    }
}
