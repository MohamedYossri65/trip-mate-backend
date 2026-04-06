import { IsOptional, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetConversationsQueryDto extends PaginationDto {

  @ApiPropertyOptional({
    description: 'Filter by conversation ended status (true for ended conversations, false for ongoing)',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isEnded?: boolean;
}
