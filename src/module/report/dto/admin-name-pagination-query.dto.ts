import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class AdminNamePaginationQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Optional name search (office name or user name)',
    example: 'Travel',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;
}
