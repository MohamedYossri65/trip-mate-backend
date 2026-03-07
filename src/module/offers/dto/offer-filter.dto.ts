import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { SortDto } from 'src/common/dto/sort.dto';
import { OfferStatus } from '../enum/offer-status.enum';
import { BookingType } from 'src/module/bookings/domain/enum/booking-type.enum';

export class OfferFilterDto extends PaginationDto implements SortDto {

    @ApiPropertyOptional({
        description: 'Filter by booking status',
        enum: OfferStatus,
    })
    @IsOptional()
    @IsString()
    status?: string;

    @ApiPropertyOptional({
        description: 'Filter by booking type',
        enum: BookingType,
    })
    @IsOptional()
    type?: BookingType;

    @ApiPropertyOptional({ enum: ['createdAt'] })
    @IsOptional()
    @IsString()
    sortBy?: 'createdAt';

    @ApiPropertyOptional({ enum: ['ASC', 'DESC'] })
    @IsOptional()
    sortOrder: 'ASC' | 'DESC' = 'DESC';
}
