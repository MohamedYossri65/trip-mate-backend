import { Injectable } from '@nestjs/common';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { CarBooking } from '../entity/car-booking.entity';
import { CarFilterDto } from '../dto/car-filter.dto';

@Injectable()
export class CarBookingRepository extends Repository<CarBooking> {
  constructor(private dataSource: DataSource) {
    super(CarBooking, dataSource.createEntityManager());
  }

  async findWithFilters(
    dto: CarFilterDto,
  ): Promise<[CarBooking[], number]> {
    const qb = this.createQueryBuilder('car')
      .leftJoinAndSelect('car.booking', 'booking')
      .leftJoinAndSelect('booking.user', 'user')
      .leftJoinAndSelect('user.account', 'account');

    this.applyFilters(qb, dto);
    this.applySort(qb, dto);
    this.applyPagination(qb, dto);

    return qb.getManyAndCount();
  }

  // ─── private builders ────────────────────────────────────────────────────

  private applyFilters(
    qb: SelectQueryBuilder<CarBooking>,
    dto: CarFilterDto,
  ): void {
    if (dto.arrivalCountry) {
      qb.andWhere('car.arrivalCountry = :arrivalCountry', { arrivalCountry: dto.arrivalCountry });
    }
    if (dto.arrivalCity) {
      qb.andWhere('car.arrivalCity = :arrivalCity', { arrivalCity: dto.arrivalCity });
    }
    if (dto.status) {
      qb.andWhere('booking.status = :status', { status: dto.status });
    }
  }

  private applySort(
    qb: SelectQueryBuilder<CarBooking>,
    dto: CarFilterDto,
  ): void {
    const allowedSortColumns: Record<string, string> = {
      createdAt: 'booking.createdAt',
    };

    const sortColumn = allowedSortColumns[dto.sortBy ?? 'createdAt'];
    qb.orderBy(sortColumn, dto.sortOrder ?? 'DESC');
  }

  private applyPagination(
    qb: SelectQueryBuilder<CarBooking>,
    dto: CarFilterDto,
  ): void {
    qb.skip(dto.skip).take(dto.limit);
  }
}
