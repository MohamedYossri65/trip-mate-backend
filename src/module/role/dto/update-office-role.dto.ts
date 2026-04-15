import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateRoleDto } from './create-office-role.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateRoleDto extends PartialType(CreateRoleDto) {
	@ApiPropertyOptional({ example: true })
	@IsOptional()
	@IsBoolean()
	isActive?: boolean;
}
