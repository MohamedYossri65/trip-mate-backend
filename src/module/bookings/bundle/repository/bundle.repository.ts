import { Injectable } from '@nestjs/common';
import { DataSource, In, Repository, SelectQueryBuilder } from 'typeorm';
import { Bundle } from '../../domain/entity/bundle.entity';
import { BundleFilterDto } from '../dto/bundle-filter.dto';

@Injectable()
export class BundleRepository extends Repository<Bundle> {
    constructor(private dataSource: DataSource) {
        super(Bundle, dataSource.createEntityManager());
    }

    async findWithFilters(
        dto: BundleFilterDto,
    ): Promise<[Bundle[], number]> {
        const qb = this.createQueryBuilder('bundle')
            .leftJoinAndSelect('bundle.user', 'user')
            .leftJoinAndSelect('user.account', 'account')
            .leftJoinAndSelect('bundle.bookings', 'booking');

        if (dto.status) {
            qb.andWhere('booking.status = :status', { status: dto.status });
        }

        const allowedSortColumns: Record<string, string> = {
            createdAt: 'bundle.createdAt',
        };
        const sortColumn = allowedSortColumns[dto.sortBy ?? 'createdAt'];
        qb.orderBy(sortColumn, dto.sortOrder ?? 'DESC');

        qb.skip(dto.skip).take(dto.limit);

        return qb.getManyAndCount();
    }


    async findOneWithBookings(id: bigint): Promise<Bundle | null> {
        return this.createQueryBuilder('bundle')
            .leftJoinAndSelect('bundle.bookings', 'booking')
            .leftJoinAndSelect('booking.user', 'user')
            .leftJoinAndSelect('user.account', 'account')
            .where('bundle.id = :id', { id })
            .getOne();
    }
}
