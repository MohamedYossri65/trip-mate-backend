import { Injectable } from '@nestjs/common';
import { Brackets, DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { Booking } from '../entity/booking.entity';
import { BookingFilterDto } from '../dto/booking-filter.dto';
import { MyBookingFilterDto } from '../dto/my-booking-filter.dto';
import { BookingType } from '../enum/booking-type.enum';
import { BookingStatus } from '../enum/booking-status.enum';


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
    dto: BookingFilterDto | MyBookingFilterDto,
  ): void {
    if (dto.arrivalCountry) {
      qb.andWhere('booking.arrivalCountry = :arrivalCountry', { arrivalCountry: dto.arrivalCountry });
    }
    if (dto.status) {
      if (dto.status === 'PENDING') {
        qb.andWhere('booking.status IN (:...status)', {
          status: [
            BookingStatus.CONFIRMED,
            BookingStatus.OFFER_ACCEPTED,
            BookingStatus.PARTIALLY_PAID,
            BookingStatus.UNDER_NEGOTIATION,
            BookingStatus.WAITING_FOR_OFFERS
          ]
        });
      } else if (dto.status === 'COMPLETED') {
        qb.andWhere('booking.status = :status', { status: BookingStatus.COMPLETED });
      } else {
        qb.andWhere('booking.status = :status', { status: dto.status });
      }
    }
    if (dto.type) {
      qb.andWhere('booking.type = :type', { type: dto.type });
    }
  }

  private applySort(
    qb: SelectQueryBuilder<Booking>,
    dto: BookingFilterDto | MyBookingFilterDto,
  ): void {
    const allowedSortColumns: Record<string, string> = {
      createdAt: 'booking.createdAt',
    };

    const sortColumn = allowedSortColumns[dto.sortBy ?? 'createdAt'];
    qb.orderBy(sortColumn, dto.sortOrder ?? 'DESC');
  }

  private applyPagination(
    qb: SelectQueryBuilder<Booking>,
    dto: BookingFilterDto | MyBookingFilterDto,
  ): void {
    qb.skip(dto.skip).take(dto.limit);
  }

  async findUserBookings(accountId: bigint, dto: MyBookingFilterDto): Promise<[Booking[], number]> {
    const qb = this.createQueryBuilder('booking')
      .leftJoinAndSelect('booking.user', 'user')
      .leftJoinAndSelect('user.account', 'account')
      .where('user.account_id = :accountId', { accountId })
      .andWhere(new Brackets(qb => {
        qb.where('booking.parent_id IS NULL')
          .orWhere('booking.type = :type', { type: BookingType.BUNDLE });
      }));
    this.applyPagination(qb, dto);
    this.applyFilters(qb, dto);
    this.applySort(qb, dto);
    return qb.getManyAndCount();
  }
}
