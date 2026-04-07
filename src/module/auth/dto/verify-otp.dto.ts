import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class VerifyOtpDto {
  @IsString()
  @IsNotEmpty()
  emailOrPhone: string;

  @IsNotEmpty()
  otp: string;
}
