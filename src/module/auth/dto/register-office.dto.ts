import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { CreateAccountDto } from '../../account/dto/create-account.dto';

export class RegisterOfficeDto {
  @IsNotEmpty()
  @IsString()
  officeName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  phone: string;

  @IsNotEmpty()
  location: string;

  @IsNotEmpty()
  password: string;
}
