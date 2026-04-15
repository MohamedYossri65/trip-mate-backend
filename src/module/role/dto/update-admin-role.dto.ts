import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateAdminRoleDto } from './create-admin-role.dto';

export class UpdateAdminRoleDto extends PartialType(CreateAdminRoleDto) {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
