import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RegisterUserDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  phone: string;

  @IsNotEmpty()
  password: string;
}
