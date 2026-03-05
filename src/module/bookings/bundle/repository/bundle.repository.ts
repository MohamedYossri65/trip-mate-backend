import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Booking } from '../../domain/entity/booking.entity';
import { BookingType } from '../../domain/enum/booking-type.enum';
import { BundleFilterDto } from '../dto/bundle-filter.dto';

@Injectable()
export class BundleRepository extends Repository<Booking> {
    constructor(private dataSource: DataSource) {
        super(Booking, dataSource.createEntityManager());
    }

    async findWithFilters(
        dto: BundleFilterDto,
    ): Promise<[Booking[], number]> {
        const qb = this.createQueryBuilder('booking')
            .leftJoinAndSelect('booking.user', 'user')
            .leftJoinAndSelect('user.account', 'account')
            .leftJoinAndSelect('booking.children', 'child')
            .where('booking.type = :type', { type: BookingType.BUNDLE });

        if (dto.status) {
            qb.andWhere('child.status = :status', { status: dto.status });
        }

        const allowedSortColumns: Record<string, string> = {
            createdAt: 'booking.createdAt',
        };
        const sortColumn = allowedSortColumns[dto.sortBy ?? 'createdAt'];
        qb.orderBy(sortColumn, dto.sortOrder ?? 'DESC');
        qb.skip(dto.skip).take(dto.limit);

        return qb.getManyAndCount();
    }

    async findManyWithBookings(ids: bigint[]): Promise<Booking[]> {
        if (!ids.length) return [];
        return this.createQueryBuilder('booking')
            .leftJoinAndSelect('booking.user', 'user')
            .leftJoinAndSelect('user.account', 'account')
            .leftJoinAndSelect('booking.children', 'child')
            .where('booking.id IN (:...ids) AND booking.type = :type', { ids, type: BookingType.BUNDLE })
            .getMany();
    }

    async findOneWithBookings(id: bigint): Promise<Booking | null> {
        const results = await this.findManyWithBookings([id]);
        return results[0] ?? null;
    }
}
