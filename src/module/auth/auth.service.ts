import { BadRequestException, HttpException, Injectable, Res, UnauthorizedException } from '@nestjs/common';
import { OtpService } from '../otp/otp.service';
import { RegisteriationService } from './registeration.service';
import { JwtService } from '@nestjs/jwt';
import { AccountService } from '../account/account.service';
import { RegisterUserResponse } from './mapper/register-user.mapper';
import { RegisterUserDto } from './dto/register-user.dto';
import { OtpPurpose } from '../otp/enum/otp-purpose.enum';
import { LoginResponse } from './mapper/login-response.mapper';
import { SessionService } from './session.service';
import { Account } from '../account/entity/account.entity';
import { RegisterOfficeDto } from './dto/register-office.dto';
import { RegisterOfficeResponse } from './mapper/register-office.mapper';
import { RolesEnum } from 'src/common/enums/roles.enum';
import { OfficeService } from '../office/office.service';
import { ReviewOfficeStatus } from '../office/enum/review-office-status.enum';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePhoneDto } from './dto/change-phone.dto';
import { ResponseCode } from 'src/common/constant/responses-code';

@Injectable()
export class AuthService {
  constructor(
    private readonly registrationService: RegisteriationService,
    private readonly otpService: OtpService,
    private readonly jwtService: JwtService,
    private readonly sessionService: SessionService,
    private readonly accountService: AccountService,
    private readonly officeService: OfficeService,
  ) { }

  async registerUser(dto: RegisterUserDto): Promise<RegisterUserResponse> {
    const result = await this.registrationService.registerUser(dto);

    await this.otpService.generate(
      result.accountId,
      OtpPurpose.PHONE_VERIFICATION,
    );

    return result;
  }

  async registerOffice(
    dto: RegisterOfficeDto,
  ): Promise<RegisterOfficeResponse> {
    const result = await this.registrationService.registerOffice(dto);
    await this.otpService.generate(
      result.accountId,
      OtpPurpose.PHONE_VERIFICATION,
    );
    return result;
  }

  async verifyPhoneOtp(
    accountId: bigint,
    otp: string,
    req: Request,
  ): Promise<LoginResponse> {
    await this.otpService.verify(accountId, OtpPurpose.PHONE_VERIFICATION, otp);

    const account = await this.registrationService.markPhoneVerified(accountId);
    await this.registrationService.changeAccountStatusAfterVerification(account);

    const tokens = await this.generateTokens(account);

    const session = await this.sessionService.createSession({
      account,
      refreshToken: tokens.refreshToken,
      req,
    });

    return LoginResponse.fromEntity({
      account,
      ...tokens,
      sessionId: session.id,
    });
  }

  async login(
    emailOrPhone: string,
    password: string,
    req: Request,
  ): Promise<LoginResponse> {
    const account = await this.accountService.validateCredentials(
      emailOrPhone,
      password,
    );

    const validationStatus = await this.validateAccount(account);
    if (validationStatus === 'OTP_SENT') {
      throw new HttpException(
        'Phone number not verified. OTP has been resent to your phone.',
        ResponseCode.REDIRECT_TO_VEREFY,
      );
    }

    const tokens = await this.generateTokens(account);

    const session = await this.sessionService.createSession({
      account,
      refreshToken: tokens.refreshToken,
      req,
    });

    return LoginResponse.fromEntity({
      account,
      accountStage: validationStatus,
      ...tokens,
      sessionId: session.id,
    });
  }


  async forgotPassword(emailOrPhone: string) {
    const account = await this.accountService.findByIdentifier(emailOrPhone);
    if (!account) {
      throw new BadRequestException('Account not found');
    }
    await this.otpService.generate(account.id, OtpPurpose.PASSWORD_RESET);
  }

  async verifyPasswordResetOtp(
    emailOrPhone: string,
    otp: string,
  ) {
    const account = await this.accountService.findByIdentifier(emailOrPhone);
    if (!account) {
      throw new BadRequestException('Account not found');
    }
    await this.otpService.verify(account.id, OtpPurpose.PASSWORD_RESET, otp);

    // Issue a short-lived reset token (5 min) to authorize the password change
    const resetToken = await this.jwtService.signAsync(
      { sub: account.id, purpose: 'password-reset' },
      { secret: process.env.JWT_ACCESS_SECRET, expiresIn: '5m' },
    );

    return { resetToken };
  }

  async resetPassword(resetToken: string, newPassword: string) {
    try {
      const payload = await this.jwtService.verifyAsync(resetToken, {
        secret: process.env.JWT_ACCESS_SECRET,
      });

      if (payload.purpose !== 'password-reset') {
        throw new UnauthorizedException('Invalid reset token');
      }

      await this.accountService.updatePassword(payload.sub, newPassword);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired reset token');
    }
  }

  async getMe(accountId: bigint) {
    return await this.registrationService.getMe(accountId);
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

  async resendPhoneVerificationOtp(accountId: number) {
    const accountIdBigInt = BigInt(accountId);
    return await this.otpService.generate(
      accountIdBigInt,
      OtpPurpose.PHONE_VERIFICATION,
    );
  }

  async refreshTokens(
    accountId: bigint,
    sessionId: bigint,
    oldRefreshToken: string,
  ) {
    const session = await this.sessionService.validateSession(
      accountId,
      sessionId,
      oldRefreshToken,
    );

    const account = session.account;

    const tokens = await this.generateTokens(account);

    await this.sessionService.rotateRefreshToken(session, tokens.refreshToken);
    return {
      ...tokens,
      sessionId: session.id,
    };
  }

  async updateUserProfile(accountId: bigint, updateProfileDto: UpdateProfileDto) {
    const account = await this.accountService.findById(accountId);
    if (!account) {
      throw new BadRequestException('Account not found');
    }
    await this.registrationService.updateUserProfile(accountId, updateProfileDto);
    return { ...account, updateName: updateProfileDto.name };
  }


  async changePhoneNumber(accountId: bigint, changePhoneDto: ChangePhoneDto) {
    const account = await this.accountService.findById(accountId);
    if (!account) {
      throw new BadRequestException('Account not found');
    }

    // Verify password before allowing phone change
    const isPasswordValid = await this.accountService.validateCredentials(
      account.email || account.phone,
      changePhoneDto.password,
    ).then(() => true).catch(() => false);

    if (!isPasswordValid) {
      throw new BadRequestException('Invalid password');
    }

    // This resets isPhoneVerified to false and status to PENDING_OTP
    await this.accountService.changePhone(accountId, changePhoneDto.newPhone);

    // Generate a new OTP for the new phone number
    await this.otpService.generate(accountId, OtpPurpose.PHONE_VERIFICATION);

    return await this.accountService.findById(accountId);
  }

  async logoutDevice(sessionId: bigint) {
    await this.sessionService.revokeSession(sessionId);
  }

  async logoutAll(accountId: bigint) {
    await this.sessionService.revokeAllSessions(accountId);
  }

  private async generateTokens(account: Account) {
    const payload = {
      sub: account.id,
      role: account.role,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: '60m',
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '90d',
    });

    return { accessToken, refreshToken };
  }

  private async validateAccount(account: Account) {
    if (!account.isPhoneVerified) {
      await this.resendPhoneVerificationOtp(Number(account.id));
      return 'OTP_SENT';
    }

    if (account.role === RolesEnum.OFFICE) {
      const officeProfile = await this.officeService.findByAccountId(
        account.id,
      );
      if (!officeProfile?.commerceNumber) {
        return 'COMMERCE_NUMBER_MISSING';
      } else if (
        !officeProfile?.employees ||
        officeProfile.employees.length === 0
      ) {
        return 'EMPLOYEES_PENDING';
      } else if (!officeProfile?.logoUrl) {
        return 'LOGO_PENDING';
      } else if (officeProfile?.reviewStatus === ReviewOfficeStatus.PENDING) {
        return 'REVIEW_PENDING';
      } else if (officeProfile?.reviewStatus === ReviewOfficeStatus.REJECTED) {
        return 'REVIEW_REJECTED';
      }
    }
    return 'ACTIVE';
  }
}
