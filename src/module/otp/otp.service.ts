import { BadRequestException, Injectable } from '@nestjs/common';
import { Otp } from './entity/otp.entity';
import { MoreThan, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { OtpPurpose } from './enum/otp-purpose.enum';
import { OtpStatus } from './enum/otp-status.enum';
import * as bcrypt from 'bcrypt';

@Injectable()
export class OtpService {
  constructor(
    @InjectRepository(Otp)
    private readonly otpRepository: Repository<Otp>,
  ) {}

async generate(accountId: bigint, purpose: OtpPurpose): Promise<boolean> {
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

  // const code = Math.floor(100000 + Math.random() * 900000).toString();
  const code = '123456'; // for testing

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

  //  send SMS/email etc.

  return true;
}

  async verify(accountId: bigint, purpose: OtpPurpose, inputCode: string) {
    const otp = await this.otpRepository.findOne({
      where: {
        accountId,
        purpose,
        status: OtpStatus.PENDING,
      },
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
