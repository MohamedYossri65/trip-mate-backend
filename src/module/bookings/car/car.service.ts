import { Injectable } from '@nestjs/common';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { CarBookingRepository } from './repository/car-booking.repository';
import { CarFilterDto } from './dto/car-filter.dto';
import { CarBookingMapper } from './mapper/car-booking.mapper';

@Injectable()
export class CarService {
  constructor(
    private readonly carBookingRepository: CarBookingRepository,
  ) {}

  async findAll(dto: CarFilterDto): Promise<PaginatedResponseDto<CarBookingMapper>> {
    const [entities, total] = await this.carBookingRepository.findWithFilters(dto);

    const mapped = entities.map(CarBookingMapper.fromEntities);

    return new PaginatedResponseDto(mapped, total, dto.page, dto.limit);
  }
}
