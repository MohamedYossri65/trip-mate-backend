import { Injectable } from '@nestjs/common';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { Offer } from '../entity/offer.entity';
import { OfferFilterDto } from '../dto/offer-filter.dto';


@Injectable()
export class OfferRepository extends Repository<Offer> {
    constructor(private dataSource: DataSource) {
        super(Offer, dataSource.createEntityManager());
    }

    async findWithFilters(
        dto: OfferFilterDto,
        officeId?: bigint | null,
    ): Promise<[Offer[], number]> {
        const qb = this.createQueryBuilder('offer')
            .leftJoinAndSelect('offer.office', 'office')
            .leftJoinAndSelect('offer.booking', 'booking')
            .leftJoinAndSelect('booking.user', 'user')
            .leftJoinAndSelect('user.account', 'account');

        if (officeId) {
            qb.where('offer.office_id = :officeId', { officeId });
        } else {
            qb.where('1=0'); // if no officeId provided, return empty result
        }
        this.applyFilters(qb, dto);
        this.applySort(qb, dto);
        this.applyPagination(qb, dto);

        return qb.getManyAndCount();
    }

    // ─── private builders ────────────────────────────────────────────────────

    private applyFilters(
        qb: SelectQueryBuilder<Offer>,
        dto: OfferFilterDto,
    ): void {
        if (dto.status) {
            qb.andWhere('booking.status = :status', { status: dto.status });
        }
        if (dto.type) {
            qb.andWhere('booking.type = :type', { type: dto.type });
        }
    }

    private applySort(
        qb: SelectQueryBuilder<Offer>,
        dto: OfferFilterDto,
    ): void {
        const allowedSortColumns: Record<string, string> = {
            createdAt: 'booking.createdAt',
        };

        const sortColumn = allowedSortColumns[dto.sortBy ?? 'createdAt'];
        qb.orderBy(sortColumn, dto.sortOrder ?? 'DESC');
    }

    private applyPagination(
        qb: SelectQueryBuilder<Offer>,
        dto: OfferFilterDto,
    ): void {
        qb.skip(dto.skip).take(dto.limit);
    }

    async findOneByBookingId(bookingId: bigint): Promise<Offer | null> {
        return this.createQueryBuilder('offer')
            .leftJoinAndSelect('offer.booking', 'booking')
            .leftJoinAndSelect('booking.user', 'user')
            .leftJoinAndSelect('user.account', 'account')
            .where('offer.bookingId = :id', { id: bookingId })
            .getOne();
    }
}
