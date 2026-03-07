import { AccountStatus } from "src/common/enums/account-status.enum";

export class LoginResponse {
  accessToken?: string;
  refreshToken?: string;
  sessionId?: bigint;
  account: {
    accountId: BigInt;
    email: string;
    phone: string;
    role: string;
    accountStage?: string;
    status?: AccountStatus;
  };
  static fromEntity(response: any): LoginResponse {
    if (
      !response ||
      !response.account?.id ||
      !response.account?.email ||
      !response.account?.phone ||
      !response.account?.role
    ) {
      throw new Error('Invalid response entity');
    }
    return {
      accessToken: response.accessToken || null,
      refreshToken: response.refreshToken || null,
      sessionId: response.sessionId || null,
      account: {
        accountId: response.account.id,
        email: response.account.email,
        phone: response.account.phone,
        role: response.account.role,
        accountStage: response.accountStage || null,
        status: response.account.status || null,
      },
    };
  }
}
