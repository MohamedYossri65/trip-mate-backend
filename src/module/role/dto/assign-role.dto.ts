import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class AssignRoleDto {
  @ApiProperty({ example: 1, description: 'The ID of the role to assign' })
  @IsNumber()
  @IsNotEmpty()
  roleId: number;
}
