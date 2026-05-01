import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Account } from './entity/account.entity';
import { EntityManager, Repository } from 'typeorm';
import { AccountStatus } from 'src/common/enums/account-status.enum';
import { RolesEnum } from 'src/common/enums/roles.enum';
import * as bcrypt from 'bcrypt';
import { CreateAccountDto } from './dto/create-account.dto';
import { OfficeRole } from '../role/entity/office-role.entity';
import { AdminRole } from '../role/entity/admin-role.entity';
import { CreateAdminAccountDto } from './dto/create-admin-account.dto';
import { AdminProfile } from './entity/admin.profile.entity';
import { AdminEmployeesQueryDto } from '../auth/dto/admin-employees-query.dto';
import { UpdateAdminEmployeeDto } from '../auth/dto/update-admin-employee.dto';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { getSaudiPhoneVariants, normalizeSaudiPhone } from 'src/common/utils/phone.util';

@Injectable()
export class AccountService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,

    @InjectRepository(AdminProfile)
    private readonly adminProfileRepository: Repository<AdminProfile>,

    @InjectRepository(OfficeRole)
    private readonly officeRoleRepository: Repository<OfficeRole>,

    @InjectRepository(AdminRole)
    private readonly adminRoleRepository: Repository<AdminRole>,
  ) { }

  async create(
    data: CreateAccountDto,
    manager?: EntityManager,
  ): Promise<Account> {
    const repo = manager
      ? manager.getRepository(Account)
      : this.accountRepository;
    const existingEmail = await repo.findOne({
      where: { email: data.email },
    });

    if (existingEmail) {
      throw new ConflictException('Email already registered');
    }

    const existingPhone = await repo.findOne({
      where: getSaudiPhoneVariants(data.phone).map((phone) => ({ phone })),
    });

    if (existingPhone) {
      throw new ConflictException('Phone number already registered');
    }


    const hashedPassword = await bcrypt.hash(data.password, 10);
    if (data.roleId) {
      const role = await this.officeRoleRepository.findOne({
        where: { id: data.roleId, isActive: true },
      });
      if (!role) {
        throw new BadRequestException('Role not found or inactive');
      }
    }

    const account = repo.create({
      email: data.email,
      phone: normalizeSaudiPhone(data.phone),
      password: hashedPassword,
      role: data.role,
      roleId: data.roleId ? data.roleId : undefined,
      assignedRole: data.roleId ? {
        id: data.roleId,
      } : undefined,
      status: data.status || AccountStatus.PENDING_OTP,
      isPhoneVerified: data.isPhoneVerified || false,
    });
    return await repo.save(account);
  }

  async createAdminAccount(
    data: CreateAdminAccountDto,
    manager?: EntityManager,
  ): Promise<any> {
    const repo = manager
      ? manager.getRepository(Account)
      : this.accountRepository;

    const existingEmail = await repo.findOne({
      where: { email: data.email },
    });

    if (existingEmail) {
      throw new ConflictException('Email already registered');
    }

    const existingPhone = await repo.findOne({
      where: getSaudiPhoneVariants(data.phone).map((phone) => ({ phone })),
    });

    if (existingPhone) {
      throw new ConflictException('Phone number already registered');
    }

    const adminRole = await this.adminRoleRepository.findOne({
      where: { id: BigInt(data.adminRoleId), isActive: true },
    });

    if (!adminRole) {
      throw new BadRequestException('Admin role not found or inactive');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const createWithManager = async (em: EntityManager): Promise<Account> => {
      const accountRepo = em.getRepository(Account);
      const profileRepo = em.getRepository(AdminProfile);

      const account = accountRepo.create({
        email: data.email,
        phone: normalizeSaudiPhone(data.phone),
        password: hashedPassword,
        role: RolesEnum.ADMIN,
        adminRoleId: BigInt(data.adminRoleId),
        status: AccountStatus.ACTIVE,
        isPhoneVerified: true,
      });

      const savedAccount = await accountRepo.save(account);

      const adminProfile = profileRepo.create({
        accountId: savedAccount.id,
        name: data.name,
        language: data.language || 'ar',
        profilePicture: data.profilePicture || '',
      });

      await profileRepo.save(adminProfile);
      return savedAccount;
    };

    const created = manager
      ? await createWithManager(manager)
      : await this.accountRepository.manager.transaction(createWithManager);

    const createdProfile = await this.findAdminProfileByAccountId(created.id);
    return this.mapAdminEmployee(created, createdProfile, adminRole.name);
  }

  async getAdminEmployees(
    query: AdminEmployeesQueryDto,
  ): Promise<PaginatedResponseDto<any>> {
    const qb = this.accountRepository
      .createQueryBuilder('account')
      .innerJoinAndMapOne(
        'account.adminProfile',
        AdminProfile,
        'adminProfile',
        'adminProfile.accountId = account.id',
      )
      .leftJoinAndSelect('account.assignedAdminRole', 'assignedAdminRole')
      .where('account.role = :role', { role: RolesEnum.ADMIN })
      .andWhere('account.deletedAt IS NULL')
      .orderBy('account.createdAt', 'DESC')
      .skip(query.skip)
      .take(query.limit);

    if (query.search?.trim()) {
      const search = `%${query.search.trim()}%`;
      qb.andWhere(
        '(LOWER(adminProfile.name) LIKE LOWER(:search) OR LOWER(account.email) LIKE LOWER(:search) OR account.phone LIKE :search)',
        { search },
      );
    }

    const [accounts, total] = await qb.getManyAndCount();
    const mapped = accounts.map((account: any) =>
      this.mapAdminEmployee(
        account,
        account.adminProfile || null,
        account.assignedAdminRole?.name || null,
      ),
    );

    return new PaginatedResponseDto(mapped, total, query.page, query.limit);
  }

  async getAdminEmployee(accountId: bigint): Promise<any> {
    const account = await this.accountRepository
      .createQueryBuilder('account')
      .leftJoinAndMapOne(
        'account.adminProfile',
        AdminProfile,
        'adminProfile',
        'adminProfile.accountId = account.id',
      )
      .leftJoinAndSelect('account.assignedAdminRole', 'assignedAdminRole')
      .where('account.id = :accountId', { accountId: accountId.toString() })
      .andWhere('account.role = :role', { role: RolesEnum.ADMIN })
      .getOne();

    if (!account) {
      throw new BadRequestException('Admin employee not found');
    }

    return this.mapAdminEmployee(
      account as any,
      (account as any).adminProfile || null,
      (account as any).assignedAdminRole?.name || null,
    );
  }

  async updateAdminEmployee(
    accountId: bigint,
    dto: UpdateAdminEmployeeDto,
  ): Promise<any> {
    const account = await this.accountRepository.findOne({
      where: { id: accountId, role: RolesEnum.ADMIN },
    });

    if (!account) {
      throw new BadRequestException('Admin employee not found');
    }

    if (dto.adminRoleId !== undefined) {
      const adminRole = await this.adminRoleRepository.findOne({
        where: { id: BigInt(dto.adminRoleId), isActive: true },
      });
      if (!adminRole) {
        throw new BadRequestException('Admin role not found or inactive');
      }
    }

    if (dto.email !== undefined) {
      const existingEmail = await this.accountRepository.findOne({ where: { email: dto.email } });
      if (existingEmail && existingEmail.id !== accountId) {
        throw new ConflictException('Email already registered');
      }
    }

    if (dto.phone !== undefined) {
      const existingPhone = await this.accountRepository.findOne({
        where: getSaudiPhoneVariants(dto.phone).map((phone) => ({ phone })),
      });
      if (existingPhone && existingPhone.id !== accountId) {
        throw new ConflictException('Phone number already registered');
      }
    }

    await this.accountRepository.manager.transaction(async (em) => {
      const accountRepo = em.getRepository(Account);
      const profileRepo = em.getRepository(AdminProfile);

      const accountUpdates: Partial<Account> = {};
      if (dto.email !== undefined) accountUpdates.email = dto.email;
      if (dto.phone !== undefined) accountUpdates.phone = normalizeSaudiPhone(dto.phone);
      if (dto.adminRoleId !== undefined) accountUpdates.adminRoleId = BigInt(dto.adminRoleId);
      if (dto.password !== undefined) {
        accountUpdates.password = await bcrypt.hash(dto.password, 10);
      }

      if (Object.keys(accountUpdates).length > 0) {
        await accountRepo.update({ id: accountId }, accountUpdates);
      }

      const existingProfile = await profileRepo.findOne({ where: { accountId } });
      const profileUpdates: Partial<AdminProfile> = {};
      if (dto.name !== undefined) profileUpdates.name = dto.name;
      if (dto.language !== undefined) profileUpdates.language = dto.language;
      if (dto.profilePicture !== undefined) {
        profileUpdates.profilePicture = dto.profilePicture;
      }

      if (existingProfile) {
        if (Object.keys(profileUpdates).length > 0) {
          await profileRepo.update({ accountId }, profileUpdates);
        }
      } else if (Object.keys(profileUpdates).length > 0) {
        await profileRepo.save(
          profileRepo.create({
            accountId,
            name: dto.name || '',
            language: dto.language || 'ar',
            profilePicture: dto.profilePicture || '',
          }),
        );
      }
    });

    const updatedAccount = await this.accountRepository.findOne({
      where: { id: accountId },
      relations: ['assignedAdminRole'],
    });
    const updatedProfile = await this.findAdminProfileByAccountId(accountId);
    return this.mapAdminEmployee(
      updatedAccount,
      updatedProfile,
      updatedAccount?.assignedAdminRole?.name || null,
    );
  }

  async deleteAdminEmployee(accountId: bigint): Promise<void> {
    const account = await this.accountRepository.findOne({
      where: { id: accountId, role: RolesEnum.ADMIN },
    });

    if (!account) {
      throw new BadRequestException('Admin employee not found');
    }

    await this.softDelete(accountId);
  }

  async toggleAdminEmployeeStatus(accountId: bigint): Promise<any> {
    const account = await this.accountRepository.findOne({
      where: { id: accountId, role: RolesEnum.ADMIN },
    });

    if (!account) {
      throw new BadRequestException('Admin employee not found');
    }

    const nextStatus =
      account.status === AccountStatus.BLOCKED
        ? AccountStatus.ACTIVE
        : AccountStatus.BLOCKED;

    await this.accountRepository.update({ id: accountId }, { status: nextStatus });

    const updatedAccount = await this.accountRepository.findOne({
      where: { id: accountId },
      relations: ['assignedAdminRole'],
    });
    const updatedProfile = await this.findAdminProfileByAccountId(accountId);
    return this.mapAdminEmployee(
      updatedAccount,
      updatedProfile,
      updatedAccount?.assignedAdminRole?.name || null,
    );
  }

  async validateCredentials(
    emailOrPhone: string,
    password: string,
  ): Promise<Account> {
    const account = await this.findByIdentifier(emailOrPhone);
    if (!account) {
      throw new BadRequestException('Invalid credentials');
    }
    const isPasswordValid = await bcrypt.compare(password, account.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid credentials');
    }
    return account;
  }

  async findById(id: bigint): Promise<Account | null> {
    return await this.accountRepository.findOne({ where: { id } });
  }

  async findByIdWithRoles(id: bigint): Promise<Account | null> {
    return await this.accountRepository.findOne({
      where: { id },
      relations: ['assignedRole', 'assignedAdminRole'],
    });
  }

  async findByEmail(email: string): Promise<Account | null> {
    return await this.accountRepository.findOne({ where: { email } });
  }

  async findByPhone(phone: string): Promise<Account | null> {
    const phoneVariants = getSaudiPhoneVariants(phone);
    if (!phoneVariants.length) {
      return null;
    }

    return await this.accountRepository.findOne({
      where: phoneVariants.map((phoneValue) => ({ phone: phoneValue })),
    });
  }

  async findByIdentifier(identifier: string): Promise<Account | null> {
    if (identifier.includes('@')) {
      return await this.accountRepository.findOne({ where: { email: identifier } });
    }

    const phoneVariants = getSaudiPhoneVariants(identifier);
    if (!phoneVariants.length) {
      return await this.accountRepository.findOne({ where: { email: identifier } });
    }

    return await this.accountRepository.findOne({
      where: [
        { email: identifier },
        ...phoneVariants.map((phone) => ({ phone })),
      ],
    });
  }

  async updatePassword(accountId: bigint, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.accountRepository.update(
      { id: accountId },
      { password: hashedPassword },
    );
  }

  async updateStatus(accountId: bigint, status: AccountStatus): Promise<void> {
    await this.accountRepository.update({ id: accountId }, { status });
  }

  async verifyPhone(emailOrPhone: string) {
    const account = await this.findByIdentifier(emailOrPhone);
    if (!account) {
      throw new BadRequestException('Account not found');
    }
    account.isPhoneVerified = true;
    await this.accountRepository.save(account);
    return account;
  }

  async updateProfile(accountId: bigint, email: string): Promise<void> {
    await this.accountRepository.update(
      { id: accountId },
      { email },
    );
  }

  async changePhone(accountId: bigint, newPhone: string): Promise<void> {
    await this.accountRepository.update(
      { id: accountId },
      {
        phone: normalizeSaudiPhone(newPhone),
        isPhoneVerified: false,
        status: AccountStatus.PENDING_OTP,
      },
    );
  }

  async isEmailTaken(email: string): Promise<boolean> {
    const query = this.accountRepository.createQueryBuilder('account')
      .where('account.email = :email', { email });
    const result = await query.getOne();
    return !!result;
  }

  async isPhoneTaken(phone: string): Promise<boolean> {
    const phoneVariants = getSaudiPhoneVariants(phone);
    if (!phoneVariants.length) {
      return false;
    }

    const query = this.accountRepository.createQueryBuilder('account')
      .where('account.phone IN (:...phones)', { phones: phoneVariants });
    const result = await query.getOne();
    return !!result;
  }

  async softDelete(accountId: bigint): Promise<void> {
    const stamp = Date.now();
    await this.accountRepository.update(
      { id: accountId },
      {
        status: AccountStatus.BLOCKED,
        isPhoneVerified: false,
        email: `deleted_${accountId.toString()}_${stamp}@deleted.local`,
        phone: `DEL-${accountId.toString()}-${stamp}`,
      },
    );
  }

  async assignRole(accountId: bigint, roleId: bigint): Promise<void> {
    const account = await this.findById(accountId);
    if (!account) {
      throw new BadRequestException('Account not found');
    }

    const role = await this.officeRoleRepository.findOne({
      where: { id: roleId, isActive: true },
    });
    if (!role) {
      throw new BadRequestException('Role not found or inactive');
    }

    await this.accountRepository.update({ id: accountId }, { roleId });
  }

  async removeRole(accountId: bigint): Promise<void> {
    const account = await this.findById(accountId);
    if (!account) {
      throw new BadRequestException('Account not found');
    }
    await this.accountRepository.update({ id: accountId }, { roleId: null as any });
  }


  async findAdminProfileByAccountId(accountId: bigint): Promise<AdminProfile | null> {
    return await this.adminProfileRepository.findOne({
      where: { accountId },
    });
  }

  private mapAdminEmployee(
    account: Account | null,
    adminProfile: AdminProfile | null,
    adminRoleName?: string | null,
  ) {
    if (!account) {
      return null;
    }

    return {
      accountId: account.id?.toString(),
      email: account.email,
      phone: account.phone,
      role: account.role,
      status: account.status,
      adminRoleId: account.adminRoleId ? account.adminRoleId.toString() : null,
      adminRoleName: adminRoleName || account.assignedAdminRole?.name || null,
      profilePicture: adminProfile?.profilePicture || '',
      name: adminProfile?.name || '',
      language: adminProfile?.language || 'ar',
      createdAt: account.createdAt,
    };
  }
}
