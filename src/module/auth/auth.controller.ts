import { ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, Req, UseGuards } from '@nestjs/common';
import { RegisterUserDto } from './dto/register-user.dto';
import { RegisterUserResponse } from './mapper/register-user.mapper';
import { RegisterOfficeResponse } from './mapper/register-office.mapper';
import { RegisterOfficeDto } from './dto/register-office.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { SuccessResponse } from 'src/common/interceptors/success-response.interceptor';
import { CurrentUser } from 'src/common/guards/decorators/user.decorator';
import { Account } from '../account/entity/account.entity';
import { RefreshTokenGuard } from 'src/common/guards/refresh-token.guard';
import { RefreshTokenRequestDto } from './dto/refresh-token.-requestdto';
import { LoginRequestDto } from './dto/login-request.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyPasswordResetOtpDto } from './dto/verify-password-reset-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePhoneDto } from './dto/change-phone.dto';
import { ActivateOfficeEmployeeInviteDto } from './dto/activate-office-employee-invite.dto';
import { Auth } from 'src/common/guards/decorators/auth.decorator';
import { Public } from 'src/common/guards/decorators/public.decorator';

@ApiTags('auth')
@Controller({ path: 'auth', version: '1' })
@Public()
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register/user')
  @SuccessResponse(
    'User registered successfully. Please verify your phone number with the OTP sent to you.',
  )
  async registerUser(
    @Body() dto: RegisterUserDto,
  ): Promise<RegisterUserResponse> {
    return await this.authService.registerUser(dto);
  }

  @Post('register/office')
  @SuccessResponse(
    'Office registered successfully. Please verify your phone number with the OTP sent to you.',
  )
  async registerOffice(
    @Body() dto: RegisterOfficeDto,
  ): Promise<RegisterOfficeResponse> {
    return await this.authService.registerOffice(dto);
  }

  @Post('login')
  @SuccessResponse('Logged in successfully')
  async login(@Body() body: LoginRequestDto, @Req() req: Request) {
    const { emailOrPhone, password } = body;
    return await this.authService.login(emailOrPhone, password, req);
  }

  @Post('verify-otp')
  @SuccessResponse('Phone number verified successfully')
  async verifyOtp(@Body() body: VerifyOtpDto, @Req() req: Request) {
    return await this.authService.verifyPhoneOtp(body.accountId, body.otp, req);
  }

  @Post('resend-otp/:accountId')
  @ApiParam({ name: 'accountId', type: 'integer' })
  @SuccessResponse('OTP resent again successfully')
  async resendOtp(@Param('accountId', ParseIntPipe) accountId: number) {
    return await this.authService.resendPhoneVerificationOtp(accountId);
  }

  @Post('forgot-password')
  @SuccessResponse('OTP sent to your registered phone number')
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    await this.authService.forgotPassword(body.emailOrPhone);
    return;
  }

  @Post('verify-password-reset-otp')
  @SuccessResponse('OTP verified successfully')
  async verifyPasswordResetOtp(@Body() body: VerifyPasswordResetOtpDto) {
    return await this.authService.verifyPasswordResetOtp(
      body.emailOrPhone,
      body.otp,
    );
  }

  @Post('reset-password')
  @SuccessResponse('Password reset successfully')
  async resetPassword(@Body() body: ResetPasswordDto) {
    await this.authService.resetPassword(body.resetToken, body.newPassword);
    return;
  }

  @Get('me')
  @Auth()
  @SuccessResponse('Account retrieved successfully')
  async getMe(@CurrentUser() account: Account) {
    return await this.authService.getMe(account.id);
  }

  @Post('update-password')
  @Auth()
  @SuccessResponse('Password updated successfully')
  async updatePassword(@Body() body: UpdatePasswordDto, @CurrentUser() account: Account) {
    await this.authService.updatePassword(account.id, body);
  }

  @Post('update-user-profile')
  @Auth()
  @SuccessResponse('Profile updated successfully')
  async updateProfile(@Body() body: UpdateProfileDto, @CurrentUser() account: Account) {
    return await this.authService.updateUserProfile(account.id, body);
  }

  @Post('change-phone')
  @Auth()
  @SuccessResponse('Phone number changed successfully. Verify your new number with the OTP sent to you.')
  async changePhone(@Body() body: ChangePhoneDto, @CurrentUser() account: Account) {
    return await this.authService.changePhoneNumber(account.id, body);
  }

  @Post('refresh')
  @UseGuards(RefreshTokenGuard)
  @SuccessResponse('Tokens refreshed successfully')
  async refresh(@Body() body: RefreshTokenRequestDto, @CurrentUser() account: Account) {
    return this.authService.refreshTokens(
      account.id,
      body.sessionId,
      body.refreshToken,
    );
  }

  @Post('logout/:sessionId')
  @Auth()
  @SuccessResponse('Logged out successfully')
  async logout(@Param('sessionId') sessionId: bigint) {
    await this.authService.logoutDevice(sessionId);
  }
}
