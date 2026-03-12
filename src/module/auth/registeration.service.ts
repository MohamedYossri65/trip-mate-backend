import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UserService } from '../user/user.service';
import { OfficeService } from '../office/office.service';
import { AccountService } from '../account/account.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { RolesEnum } from 'src/common/enums/roles.enum';
import { RegisterOfficeDto } from './dto/register-office.dto';
import { RegisterUserResponse } from './mapper/register-user.mapper';
import { RegisterOfficeResponse } from './mapper/register-office.mapper';
import { Account } from '../account/entity/account.entity';
import { AccountStatus } from 'src/common/enums/account-status.enum';
import { GetMeUserResponse } from './mapper/get-me-user.mapper';
import { GetMeOfficeResponse } from './mapper/get-me-office.mapper';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class RegisteriationService {
  constructor(
    private readonly accountService: AccountService,
    private readonly userService: UserService,
    private readonly officeService: OfficeService,
    private dataSource: DataSource,
  ) { }

  async registerUser(dto: RegisterUserDto): Promise<RegisterUserResponse> {
    const accountId = await this.dataSource.transaction(async (manager) => {
      const account = await this.accountService.create(
        {
          email: dto.email,
          phone: dto.phone,
          password: dto.password,
          role: RolesEnum.USER,
        },
        manager,
      );

      await this.userService.createProfile(
        {
          name: dto.name,
          accountId: account.id,
        },
        manager,
      );

      return account.id;
    });
    const userProfile = await this.userService.findByAccountId(accountId);
    return RegisterUserResponse.fromEntity(userProfile);
  }

  async registerOffice(
    dto: RegisterOfficeDto,
  ): Promise<RegisterOfficeResponse> {
    const accountId = await this.dataSource.transaction(async (manager) => {
      const account = await this.accountService.create(
        {
          email: dto.email,
          phone: dto.phone,
          password: dto.password,
          role: RolesEnum.OFFICE,
        },
        manager,
      );

      await this.officeService.createProfile(
        {
          officeName: dto.officeName,
          location: dto.location,
          accountId: account.id,
        },
        manager,
      );

      return account.id;
    });
    
    const officeProfile = await this.officeService.findByAccountId(accountId);
    return RegisterOfficeResponse.fromEntity(officeProfile);
  }

  async markPhoneVerified(accountId: bigint): Promise<Account> {
    return this.accountService.verifyPhone(accountId);
  }

  async changeAccountStatusAfterVerification(account: Account): Promise<void> {
    if (account.role === RolesEnum.USER) {
      await this.accountService.updateStatus(account.id, AccountStatus.ACTIVE);
    } else if (account.role === RolesEnum.OFFICE) {
      await this.accountService.updateStatus(
        account.id,
        AccountStatus.PENDING_REVIEW,
      );
    }
  }

  async getMe(accountId: bigint) {
    const account = await this.accountService.findById(accountId);
    if (!account) {
      throw new BadRequestException('Account not found');
    }

    if (account.role === RolesEnum.USER) {
      const userProfile = await this.userService.findByAccountId(accountId);
      return GetMeUserResponse.fromEntities(account, userProfile);
    } else if (account.role === RolesEnum.OFFICE) {
      const officeProfile = await this.officeService.findByAccountId(accountId);
      return GetMeOfficeResponse.fromEntities(account, officeProfile);
    }
  }

  async updatePassword(accountId: bigint, updatePasswordDto: UpdatePasswordDto) {
    const { currentPassword, newPassword } = updatePasswordDto;
    const account = await this.accountService.findById(accountId);
    if (!account) {
      throw new BadRequestException('Account not found');
    }
    const isCurrentPasswordValid = await this.accountService.validateCredentials(
      account.email,
      currentPassword,
    ).then(() => true).catch(() => false);
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }
    await this.accountService.updatePassword(accountId, newPassword);
  }

  async updateUserProfile(accountId: bigint, updateProfileDto: UpdateProfileDto) {
    const { email, name } = updateProfileDto;
    const account = await this.accountService.findById(accountId);
    if (!account) {
      throw new BadRequestException('Account not found');
    }
    await this.accountService.updateProfile(accountId, email);

    const updateName = await this.userService.updateName(accountId, name);
    return { ...account, updateName: updateName };
  }

}
