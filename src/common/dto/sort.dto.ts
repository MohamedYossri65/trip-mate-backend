import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum SortOrder {
    ASC = 'ASC',
    DESC = 'DESC',
}

export class SortDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    sortBy?: string;

    @ApiPropertyOptional({ enum: SortOrder })
    sortOrder: String = SortOrder.DESC;
}