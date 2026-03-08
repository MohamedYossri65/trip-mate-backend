import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class BannerFilterDto extends PaginationDto {
    @ApiPropertyOptional({ description: 'Filter banners by title name' })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional({ description: 'Filter banners by active status' })
    @IsOptional()
    isActive?: boolean;
}
