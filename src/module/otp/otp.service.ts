import { BadRequestException, Injectable } from '@nestjs/common';
import { Otp } from './entity/otp.entity';
import { MoreThan, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { OtpPurpose } from './enum/otp-purpose.enum';
import { OtpStatus } from './enum/otp-status.enum';
import * as bcrypt from 'bcrypt';
import { Account } from '../account/entity/account.entity';
import { MsegatSmsService } from 'src/common/services/msegat-sms.service';
import { AccountService } from '../account/account.service';
import { normalizeSaudiPhone } from 'src/common/utils/phone.util';

@Injectable()
export class OtpService {
  constructor(
    @InjectRepository(Otp)
    private readonly otpRepository: Repository<Otp>,
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    private readonly accountService: AccountService,
    private readonly msegatSmsService: MsegatSmsService,
  ) { }

  async generate(accountId: bigint, purpose: OtpPurpose): Promise<boolean> {
    const account = await this.accountRepository.findOne({
      where: { id: accountId },
      select: ['id', 'phone'],
    });

    if (!account) {
      throw new BadRequestException('Account not found');
    }

    if (!account.phone) {
      throw new BadRequestException('Account phone number is missing');
    }

    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);

    const lastOtp = await this.otpRepository.findOne({
      where: {
        accountId,
        purpose,
        createdAt: MoreThan(oneMinuteAgo),
        status: OtpStatus.PENDING,
      },
      order: { createdAt: 'DESC' },
    });

    if (lastOtp) {
      throw new BadRequestException('Wait at least 1 minute before requesting a new OTP');
    }

    await this.otpRepository.update(
      { accountId, purpose, status: OtpStatus.PENDING },
      { status: OtpStatus.EXPIRED },
    );

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    // const code = '123456'; // For testing purposes, use a fixed code

    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

    const otp = this.otpRepository.create({
      accountId,
      purpose,
      codeHash,
      expiresAt,
      status: OtpStatus.PENDING,
      attempts: 0,
      maxAttempts: 5,
    });

    await this.otpRepository.save(otp);

    const formattedPhone = normalizeSaudiPhone(account.phone);

    const smsSent = await this.msegatSmsService.sendSms({
      numbers: [formattedPhone],
      msg: `Verification Code: ${code}`,
      reqFilter: false,
    });

    if (!smsSent) {
      await this.otpRepository.update({ id: otp.id }, { status: OtpStatus.EXPIRED });
      throw new BadRequestException('Failed to send OTP SMS');
    }

    return true;
  }

  async verify(phoneOrEmail: string, purpose: OtpPurpose, inputCode: string) {
    const account = await this.accountService.findByIdentifier(phoneOrEmail);
    if (!account) throw new BadRequestException('OTP not found');

    const otp = await this.otpRepository.findOne({
      where: [
        {
          account: { id: account.id },
          purpose,
          status: OtpStatus.PENDING,
        },
      ],
      order: { createdAt: 'DESC' },
    });

    if (!otp) throw new BadRequestException('OTP not found');

    if (otp.expiresAt < new Date()) {
      otp.status = OtpStatus.EXPIRED;
      await this.otpRepository.save(otp);
      throw new BadRequestException('OTP expired');
    }

    if (otp.attempts >= otp.maxAttempts)
      throw new BadRequestException('Too many attempts');

    const isMatch = await bcrypt.compare(inputCode, otp.codeHash);

    if (!isMatch) {
      otp.attempts += 1;
      await this.otpRepository.save(otp);
      throw new BadRequestException('Invalid OTP');
    }

    otp.status = OtpStatus.VERIFIED;
    await this.otpRepository.save(otp);

    return true;
  }

}
