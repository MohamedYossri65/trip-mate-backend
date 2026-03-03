import { IsNotEmpty } from 'class-validator';

export class LoginRequestDto {
  @IsNotEmpty()
  emailOrPhone: string;
  @IsNotEmpty()
  password: string;
}
