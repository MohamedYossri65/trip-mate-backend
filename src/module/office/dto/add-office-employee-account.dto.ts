import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class InviteOfficeEmployeeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  roleInOffice: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  temporaryPassword?: string;
}
