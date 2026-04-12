import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEmail, IsPhoneNumber, IsEnum } from 'class-validator';
import { AccountStatus } from 'src/common/enums/account-status.enum';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'John Doe', description: 'User name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'john@example.com', description: 'Email address' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+966501234567', description: 'Phone number' })
  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @ApiPropertyOptional({
    enum: AccountStatus,
    example: AccountStatus.ACTIVE,
    description: 'Account status (admin only)',
  })
  @IsOptional()
  @IsEnum(AccountStatus)
  status?: AccountStatus;
}
