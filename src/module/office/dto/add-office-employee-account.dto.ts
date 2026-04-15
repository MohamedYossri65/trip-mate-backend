import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, MinLength } from 'class-validator';

export class InviteOfficeEmployeeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsNumber()
  roleInOffice: bigint;

  @IsOptional()
  @IsString()
  @MinLength(8)
  temporaryPassword?: string;
}
