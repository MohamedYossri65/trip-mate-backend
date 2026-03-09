import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { SortDto } from 'src/common/dto/sort.dto';
import { BookingType } from '../enum/booking-type.enum';

export class MyBookingFilterDto extends PaginationDto implements SortDto {

    @ApiPropertyOptional({ description: 'Filter by arrival country' })
    @IsOptional()
    @IsString()
    arrivalCountry?: string;

    @ApiPropertyOptional({
        description: 'Filter by booking status',
        enum: ['COMPLETED', 'PENDING'],
    })
    @IsOptional()
    @IsIn(['COMPLETED', 'PENDING'])
    status?: 'COMPLETED' | 'PENDING';

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
