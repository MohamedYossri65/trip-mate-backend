import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { SortDto } from 'src/common/dto/sort.dto';
import { BookingStatus } from '../../enum/booking-status.enum';

export class FlightFilterDto extends PaginationDto implements SortDto {

    @ApiPropertyOptional({ description: 'Filter by arrival country' })
    @IsOptional()
    @IsString()
    arrivalCountry?: string;

    @ApiPropertyOptional({
        description: 'Filter by booking status',
        enum: BookingStatus
    })
    @IsOptional()
    @IsString()
    status?: string;

    @ApiPropertyOptional({ enum: ['createdAt'] })
    @IsOptional()
    @IsString()
    sortBy?: 'createdAt' | 'price' | 'rating' | 'name';

    @ApiPropertyOptional({ enum: ['ASC', 'DESC'] })
    @IsOptional()
    sortOrder: 'ASC' | 'DESC' = 'DESC';
}