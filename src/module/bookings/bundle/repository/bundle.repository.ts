import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { BundleFilterDto } from '../dto/bundle-filter.dto';
import { BundleBase } from '../entity/bundle-base.entity';
import { HotelBundle } from '../entity/bundle-hotel.entity';
import { CarBundle } from '../entity/bundle-car.entity';
import { FlightBundle } from '../entity/bundle-flight.entity';
import { VisaBundle } from '../entity/bundle-visa.entity';

@Injectable()
export class BundleRepository extends Repository<BundleBase> {
    constructor(private dataSource: DataSource) {
        super(BundleBase, dataSource.createEntityManager());
    }

    async findWithFilters(
        dto: BundleFilterDto,
    ): Promise<[BundleBase[], number]> {
        const qb = this.createQueryBuilder('baseBundle')
            .leftJoinAndSelect('baseBundle.booking', 'booking')
            .leftJoinAndSelect('booking.user', 'user')
            .leftJoinAndSelect('user.account', 'account')

        if (dto.status) {
            qb.andWhere('booking.status = :status', { status: dto.status });
        }

        const allowedSortColumns: Record<string, string> = {
            createdAt: 'booking.createdAt',
        };
        const sortColumn = allowedSortColumns[dto.sortBy ?? 'createdAt'];
        qb.orderBy(sortColumn, dto.sortOrder ?? 'DESC');
        qb.skip(dto.skip).take(dto.limit);

        return qb.getManyAndCount();
    }

    async findOneBundleWithDetails(id: bigint){
        const baseBundle = await this.createQueryBuilder('baseBundle')
            .leftJoinAndSelect('baseBundle.booking', 'booking')
            .leftJoinAndSelect('booking.user', 'user')
            .leftJoinAndSelect('user.account', 'account')
            .where('baseBundle.bookingId = :id', { id })
            .getOne();
        const hotels = await this.dataSource
            .getRepository(HotelBundle)
            .createQueryBuilder('hotelBundle')
            .where('hotelBundle.bundleBaseId = :id', { id })
            .getMany();

        const cars = await this.dataSource.getRepository(CarBundle)
            .createQueryBuilder('carBundle')
            .where('carBundle.bundleBaseId = :id', { id })
            .getMany();

        const flights = await this.dataSource.getRepository(FlightBundle)
            .createQueryBuilder('flightBundle')
            .where('flightBundle.bundleBaseId = :id', { id })
            .getMany();

        const visas = await this.dataSource.getRepository(VisaBundle)
            .createQueryBuilder('visaBundle')
            .where('visaBundle.bundleBaseId = :id', { id })
            .getMany();
        return baseBundle ? { baseBundle, hotels, cars, flights, visas } : null;
    }
}
