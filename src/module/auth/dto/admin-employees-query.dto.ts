import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class AdminEmployeesQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Optional search by name, email, or phone',
    example: 'john',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}
