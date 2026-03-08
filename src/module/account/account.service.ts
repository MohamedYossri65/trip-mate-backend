import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Account } from './entity/account.entity';
import { EntityManager, Repository } from 'typeorm';
import { AccountStatus } from 'src/common/enums/account-status.enum';
import * as bcrypt from 'bcrypt';
import { CreateAccountDto } from './dto/create-account.dto';

@Injectable()
export class AccountService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
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
      where: { phone: data.phone },
    });

    if (existingPhone) {
      throw new ConflictException('Phone number already registered');
    }


    const hashedPassword = await bcrypt.hash(data.password, 10);
    const account = repo.create({
      email: data.email,
      phone: data.phone,
      password: hashedPassword,
      role: data.role,
      status: AccountStatus.PENDING_OTP,
      isPhoneVerified: false,
    });
    return await repo.save(account);
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

  async findByEmail(email: string): Promise<Account | null> {
    return await this.accountRepository.findOne({ where: { email } });
  }

  async findByPhone(phone: string): Promise<Account | null> {
    return await this.accountRepository.findOne({ where: { phone } });
  }

  async findByIdentifier(identifier: string): Promise<Account | null> {
    return await this.accountRepository.findOne({
      where: [{ email: identifier }, { phone: identifier }],
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

  async verifyPhone(accountId: bigint): Promise<Account> {
    await this.accountRepository.update(
      { id: accountId },
      { isPhoneVerified: true },
    );
    const updatedAccount = await this.accountRepository.findOne({
      where: { id: accountId },
    });
    if (!updatedAccount) {
      throw new BadRequestException('Account not found after phone verification');
    }

    return updatedAccount;
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
        phone: newPhone,
        isPhoneVerified: false,
        status: AccountStatus.PENDING_OTP,
      },
    );
  }
}
