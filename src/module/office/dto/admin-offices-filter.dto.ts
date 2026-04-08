import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { BookingType } from 'src/module/bookings/domain/enum/booking-type.enum';

export class AdminOfficesFilterDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter offices by a service type they provided offers for',
    enum: BookingType,
  })
  @IsOptional()
  @IsEnum(BookingType)
  serviceType?: BookingType;
}
