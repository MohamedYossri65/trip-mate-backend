import { Injectable } from "@nestjs/common";
import { PaginatedResponseDto } from "src/common/dto/paginated-response.dto";
import { HotelFilterDto } from "./dto/hotel-filter.dto";
import { HotelBookingRepository } from "./repository/hotel-booking.repository";
import { HotelBookingMapper } from "./mapper/hotel-booking.mapper";

@Injectable()
export class HotelService {
  constructor(
    private readonly hotelBookingRepository: HotelBookingRepository,
  ) { }

  async findAll(dto: HotelFilterDto): Promise<PaginatedResponseDto<HotelBookingMapper>> {
    const [entities, total] = await this.hotelBookingRepository.findWithFilters(dto);

    const mapped = entities.map(HotelBookingMapper.fromEntities);

    return new PaginatedResponseDto(mapped, total, dto.page, dto.limit);
  }

  async findOneByBookingId(bookingId: bigint): Promise<HotelBookingMapper | null> {
    const entity = await this.hotelBookingRepository.findOneByBookingId(bookingId);
    if (!entity) return null;
    return HotelBookingMapper.fromEntities(entity);
  }
}