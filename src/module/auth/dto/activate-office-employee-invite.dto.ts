import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ActivateOfficeEmployeeInviteDto {
  @IsString()
  @IsNotEmpty()
  accountId: string;

  @IsString()
  @IsNotEmpty()
  otp: string;

  @IsString()
  @MinLength(8)
  newPassword: string;
}
