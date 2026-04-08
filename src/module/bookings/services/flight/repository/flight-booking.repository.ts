import { Injectable } from '@nestjs/common';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { FlightBooking } from '../entity/flight.-booking.entity';
import { FlightFilterDto } from '../dto/flight-filter.dto';
import { BookingStatus } from '../../../domain/enum/booking-status.enum';


@Injectable()
export class FlightBookingRepository extends Repository<FlightBooking> {
  constructor(private dataSource: DataSource) {
    super(FlightBooking, dataSource.createEntityManager());
  }

  async findWithFilters(
    dto: FlightFilterDto,
    hideCancelled = false,
  ): Promise<[FlightBooking[], number]> {
    const qb = this.createQueryBuilder('hotel')
      .innerJoinAndSelect('hotel.booking', 'booking')
      .innerJoinAndSelect('booking.user', 'user')
      .innerJoinAndSelect('user.account', 'account')

    this.applyFilters(qb, dto);
    if (hideCancelled) {
      qb.andWhere('booking.status != :cancelledStatus', {
        cancelledStatus: BookingStatus.CANCELLED,
      });
    }
    this.applySort(qb, dto);
    this.applyPagination(qb, dto);

    return qb.getManyAndCount(); // returns [data, totalCount] in ONE query
  }

  // ─── private builders ────────────────────────────────────────────────────

  private applyFilters(
    qb: SelectQueryBuilder<FlightBooking>,
    dto: FlightFilterDto,
  ): void {
    if (dto.arrivalCountry) {
      qb.andWhere('hotel.arrivalCountry = :arrivalCountry', { arrivalCountry: dto.arrivalCountry });
    }
    if (dto.status) {
        qb.andWhere('booking.status = :status', { status: dto.status });
    }
  }

  private applySort(
    qb: SelectQueryBuilder<FlightBooking>,
    dto: FlightFilterDto,
  ): void {
    // whitelist allowed sort columns — NEVER trust raw client input for column names
    const allowedSortColumns: Record<string, string> = {
      createdAt: 'booking.createdAt',
    };

    const sortColumn = allowedSortColumns[dto.sortBy ?? 'createdAt'];
    qb.orderBy(sortColumn, dto.sortOrder ?? 'DESC');
  }

  private applyPagination(
    qb: SelectQueryBuilder<FlightBooking>,
    dto: FlightFilterDto,
  ): void {
    qb.skip(dto.skip).take(dto.limit);
  }

  async findOneByBookingId(bookingId: bigint): Promise<FlightBooking | null> {
    return this.createQueryBuilder('hotel')
      .leftJoinAndSelect('hotel.booking', 'booking')
      .leftJoinAndSelect('booking.user', 'user')
      .leftJoinAndSelect('user.account', 'account')
      .where('hotel.bookingId = :id', { id: bookingId })
      .getOne();
  }
}