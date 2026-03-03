import { Account } from "src/module/account/entity/account.entity";
import { UserProfile } from "src/module/user/entity/user.entity";


export class RegisterUserResponse {
  accountId: bigint;
  name: string;
  email: string;
  phone: string;
  role: string;

  static fromEntity(userProfile: UserProfile | null): RegisterUserResponse {
    if (!userProfile || !userProfile.account) {
      throw new Error('Invalid user profile entity');
    }
    return {
      accountId: userProfile.account.id,
      email: userProfile.account.email,
      phone: userProfile.account.phone,
      role: userProfile.account.role,
      name: userProfile.name || '',
    };
  }
}
