import { ApiHideProperty } from '@nestjs/swagger';
import { Exclude, Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional } from 'class-validator';
import { AccountStatus } from 'src/common/enums/account-status.enum';
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

  @Exclude()
  @IsOptional()
  @ApiHideProperty()
  status?: AccountStatus;

  @Exclude()
  @IsOptional()
  @ApiHideProperty()      
  isPhoneVerified?: boolean;

  @Exclude()
  @IsOptional()
  @ApiHideProperty()
  roleId?: bigint;
}
