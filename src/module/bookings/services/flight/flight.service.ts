import { Injectable } from "@nestjs/common";
import { PaginatedResponseDto } from "src/common/dto/paginated-response.dto";
import { FlightBookingRepository } from "./repository/flight-booking.repository";
import { FlightFilterDto } from "./dto/flight-filter.dto";
import { FlightBookingMapper } from "./mapper/flight-booking.mapper";

@Injectable()
export class FlightService {
  constructor(
    private readonly flightBookingRepository: FlightBookingRepository,
  ) { }

  async findAll(dto: FlightFilterDto): Promise<PaginatedResponseDto<FlightBookingMapper>> {
    const [entities, total] = await this.flightBookingRepository.findWithFilters(dto);

    const mapped = entities.map(FlightBookingMapper.fromEntities);

    return new PaginatedResponseDto(mapped, total, dto.page, dto.limit);
  }

  async findOneByBookingId(bookingId: bigint): Promise<FlightBookingMapper | null> {
    const entity = await this.flightBookingRepository.findOneByBookingId(bookingId);
    if (!entity) return null;
    return FlightBookingMapper.fromEntities(entity);
  }
}