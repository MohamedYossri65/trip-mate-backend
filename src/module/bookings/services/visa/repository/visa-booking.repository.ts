import { Injectable } from '@nestjs/common';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { VisaBooking } from '../entity/visa-booking.entity';
import { VisaFilterDto } from '../dto/visa-filter.dto';

@Injectable()
export class VisaBookingRepository extends Repository<VisaBooking> {
  constructor(private dataSource: DataSource) {
    super(VisaBooking, dataSource.createEntityManager());
  }

  async findWithFilters(
    dto: VisaFilterDto,
  ): Promise<[VisaBooking[], number]> {
    const qb = this.createQueryBuilder('visa')
      .leftJoinAndSelect('visa.booking', 'booking')
      .leftJoinAndSelect('booking.user', 'user')
      .leftJoinAndSelect('user.account', 'account');

    this.applyFilters(qb, dto);
    this.applySort(qb, dto);
    this.applyPagination(qb, dto);

    return qb.getManyAndCount();
  }

  // ─── private builders ────────────────────────────────────────────────────

  private applyFilters(
    qb: SelectQueryBuilder<VisaBooking>,
    dto: VisaFilterDto,
  ): void {
    if (dto.arrivalCountry) {
      qb.andWhere('visa.arrivalCountry = :arrivalCountry', { arrivalCountry: dto.arrivalCountry });
    }
    if (dto.visaType) {
      qb.andWhere('visa.visaType = :visaType', { visaType: dto.visaType });
    }
    if (dto.status) {
      qb.andWhere('booking.status = :status', { status: dto.status });
    }
  }

  private applySort(
    qb: SelectQueryBuilder<VisaBooking>,
    dto: VisaFilterDto,
  ): void {
    const allowedSortColumns: Record<string, string> = {
      createdAt: 'booking.createdAt',
    };

    const sortColumn = allowedSortColumns[dto.sortBy ?? 'createdAt'];
    qb.orderBy(sortColumn, dto.sortOrder ?? 'DESC');
  }

  private applyPagination(
    qb: SelectQueryBuilder<VisaBooking>,
    dto: VisaFilterDto,
  ): void {
    qb.skip(dto.skip).take(dto.limit);
  }

  async findOneByBookingId(bookingId: bigint): Promise<VisaBooking | null> {
    return this.createQueryBuilder('visa')
      .leftJoinAndSelect('visa.booking', 'booking')
      .leftJoinAndSelect('booking.user', 'user')
      .leftJoinAndSelect('user.account', 'account')
      .where('visa.bookingId = :id', { id: bookingId })
      .getOne();
  }
}
