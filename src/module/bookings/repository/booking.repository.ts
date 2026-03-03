import { Injectable } from '@nestjs/common';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { Booking } from '../entity/booking.entity';
import { BookingFilterDto } from '../dto/booking-filter.dto';


@Injectable()
export class BookingRepository extends Repository<Booking> {
  constructor(private dataSource: DataSource) {
    super(Booking, dataSource.createEntityManager());
  }

  async findWithFilters(
    dto: BookingFilterDto,
  ): Promise<[Booking[], number]> {
    const qb = this.createQueryBuilder('booking')
      .leftJoinAndSelect('booking.user', 'user')
      .leftJoinAndSelect('user.account', 'account');

    this.applyFilters(qb, dto);
    this.applySort(qb, dto);
    this.applyPagination(qb, dto);

    return qb.getManyAndCount();
  }

  // ─── private builders ────────────────────────────────────────────────────

  private applyFilters(
    qb: SelectQueryBuilder<Booking>,
    dto: BookingFilterDto,
  ): void {
    if (dto.arrivalCountry) {
      qb.andWhere('booking.arrivalCountry = :arrivalCountry', { arrivalCountry: dto.arrivalCountry });
    }
    if (dto.status) {
      qb.andWhere('booking.status = :status', { status: dto.status });
    }
    if (dto.type) {
      qb.andWhere('booking.type = :type', { type: dto.type });
    }
  }

  private applySort(
    qb: SelectQueryBuilder<Booking>,
    dto: BookingFilterDto,
  ): void {
    const allowedSortColumns: Record<string, string> = {
      createdAt: 'booking.createdAt',
    };

    const sortColumn = allowedSortColumns[dto.sortBy ?? 'createdAt'];
    qb.orderBy(sortColumn, dto.sortOrder ?? 'DESC');
  }

  private applyPagination(
    qb: SelectQueryBuilder<Booking>,
    dto: BookingFilterDto,
  ): void {
    qb.skip(dto.skip).take(dto.limit);
  }
}
