import { Injectable } from '@nestjs/common';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { VisaBookingRepository } from './repository/visa-booking.repository';
import { VisaFilterDto } from './dto/visa-filter.dto';
import { VisaBookingMapper } from './mapper/visa-booking.mapper';

@Injectable()
export class VisaService {
  constructor(
    private readonly visaBookingRepository: VisaBookingRepository,
  ) {}

  async findAll(dto: VisaFilterDto): Promise<PaginatedResponseDto<VisaBookingMapper>> {
    const [entities, total] = await this.visaBookingRepository.findWithFilters(dto);

    const mapped = entities.map(VisaBookingMapper.fromEntities);

    return new PaginatedResponseDto(mapped, total, dto.page, dto.limit);
  }
}
