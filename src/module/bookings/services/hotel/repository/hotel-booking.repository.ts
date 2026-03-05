import { Injectable } from '@nestjs/common';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { HotelBooking } from '../entity/hotel-booking.entity';
import { HotelFilterDto } from '../dto/hotel-filter.dto';

@Injectable()
export class HotelBookingRepository extends Repository<HotelBooking> {
  constructor(private dataSource: DataSource) {
    super(HotelBooking, dataSource.createEntityManager());
  }

  async findWithFilters(
    dto: HotelFilterDto,
  ): Promise<[HotelBooking[], number]> {
    const qb = this.createQueryBuilder('hotel')
      .leftJoinAndSelect('hotel.booking', 'booking')
      .leftJoinAndSelect('booking.user', 'user')
      .leftJoinAndSelect('user.account', 'account');

    this.applyFilters(qb, dto);
    this.applySort(qb, dto);
    this.applyPagination(qb, dto);

    return qb.getManyAndCount(); // returns [data, totalCount] in ONE query
  }

  // ─── private builders ────────────────────────────────────────────────────

  private applyFilters(
    qb: SelectQueryBuilder<HotelBooking>,
    dto: HotelFilterDto,
  ): void {
    if (dto.arrivalCountry) {
      qb.andWhere('hotel.arrivalCountry = :arrivalCountry', { arrivalCountry: dto.arrivalCountry });
    }
    if (dto.status) {
        qb.andWhere('booking.status = :status', { status: dto.status });
    }
  }

  private applySort(
    qb: SelectQueryBuilder<HotelBooking>,
    dto: HotelFilterDto,
  ): void {
    // whitelist allowed sort columns — NEVER trust raw client input for column names
    const allowedSortColumns: Record<string, string> = {
      createdAt: 'booking.createdAt',
    };

    const sortColumn = allowedSortColumns[dto.sortBy ?? 'createdAt'];
    qb.orderBy(sortColumn, dto.sortOrder ?? 'DESC');
  }

  private applyPagination(
    qb: SelectQueryBuilder<HotelBooking>,
    dto: HotelFilterDto,
  ): void {
    qb.skip(dto.skip).take(dto.limit);
  }

  async findOneByBookingId(bookingId: bigint): Promise<HotelBooking | null> {
    return this.createQueryBuilder('hotel')
      .leftJoinAndSelect('hotel.booking', 'booking')
      .leftJoinAndSelect('booking.user', 'user')
      .leftJoinAndSelect('user.account', 'account')
      .where('hotel.bookingId = :id', { id: bookingId })
      .getOne();
  }
}