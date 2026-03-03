import { IsNotEmpty, IsNumber } from 'class-validator';

export class VerifyOtpDto {
  @IsNumber()
  @IsNotEmpty()
  accountId: bigint;

  @IsNotEmpty()
  otp: string;
}
