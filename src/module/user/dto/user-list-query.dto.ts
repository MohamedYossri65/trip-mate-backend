import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class UserListQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Search users by name',
    example: 'ahmed',
  })
  @IsOptional()
  @IsString()
  @Type(() => String)
  search?: string;
}