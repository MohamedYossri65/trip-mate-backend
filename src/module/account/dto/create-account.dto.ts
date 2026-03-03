import { ApiHideProperty } from '@nestjs/swagger';
import { Exclude, Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty } from 'class-validator';
import { RolesEnum } from 'src/common/enums/roles.enum';

export class CreateAccountDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  phone: string;

  @IsNotEmpty()
  password: string;

  @Exclude()
  @ApiHideProperty()
  @Transform(() => undefined)
  role: RolesEnum;
}
