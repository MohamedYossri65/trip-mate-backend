import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { AccountStatus } from 'src/common/enums/account-status.enum';

export class UpdateOfficeByAdminDto {
  @ApiPropertyOptional({ description: 'Office logo URL' })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({ description: 'Office name' })
  @IsOptional()
  @IsString()
  officeName?: string;

  @ApiPropertyOptional({ description: 'Office location' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Commercial registration number' })
  @IsOptional()
  @IsString()
  commerceNumber?: string;

  @ApiPropertyOptional({
    description: 'Account status',
    enum: AccountStatus,
  })
  @IsOptional()
  @IsEnum(AccountStatus)
  accountStatus?: AccountStatus;
}
