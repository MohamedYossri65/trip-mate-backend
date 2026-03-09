import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { SortDto } from 'src/common/dto/sort.dto';
import { BookingType } from '../enum/booking-type.enum';
import { BookingStatus } from '../enum/booking-status.enum';

export class BookingFilterDto extends PaginationDto implements SortDto {

    @ApiPropertyOptional({ description: 'Filter by arrival country' })
    @IsOptional()
    @IsString()
    arrivalCountry?: string;

    @ApiPropertyOptional({
        description: 'Filter by booking status',
        enum: BookingStatus,
    })
    @IsOptional()
    @IsEnum(BookingStatus)
    status?: BookingStatus;

    @ApiPropertyOptional({ description: 'Filter by Booking type' })
    @IsOptional()
    @IsEnum(BookingType)
    type?: BookingType;

    @ApiPropertyOptional({ enum: ['createdAt'] })
    @IsOptional()
    @IsString()
    sortBy?: 'createdAt';

    @ApiPropertyOptional({ enum: ['ASC', 'DESC'] })
    @IsOptional()
    sortOrder: 'ASC' | 'DESC' = 'DESC';
}
