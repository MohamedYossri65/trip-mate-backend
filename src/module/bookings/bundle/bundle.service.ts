import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import { BundleRepository } from './repository/bundle.repository';
import { BundleFilterDto } from './dto/bundle-filter.dto';
import { BundleMapper } from './mapper/bundle.mapper';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { BookingType } from '../domain/enum/booking-type.enum';
import { Booking } from '../domain/entity/booking.entity';
import { HotelBooking } from '../services/hotel/entity/hotel-booking.entity';
import { CarBooking } from '../services/car/entity/car-booking.entity';
import { FlightBooking } from '../services/flight/entity/flight.-booking.entity';
import { VisaBooking } from '../services/visa/entity/visa-booking.entity';

@Injectable()
export class BundleService {
    constructor(
        private readonly bundleRepository: BundleRepository,
        private readonly dataSource: DataSource,
    ) { }

    // Single source of truth: batch-fetch sub-entities and stitch into BundleMappers.
    // All public methods delegate here — zero logic duplication.
    private async buildMappersForBundles(bundles: Booking[]): Promise<BundleMapper[]> {
        if (!bundles.length) return [];

        const hotelIds: bigint[] = [];
        const carIds: bigint[] = [];
        const flightIds: bigint[] = [];
        const visaIds: bigint[] = [];

        for (const bundle of bundles) {
            for (const child of bundle.children ?? []) {
                if (child.type === BookingType.HOTEL) hotelIds.push(child.id);
                else if (child.type === BookingType.CAR) carIds.push(child.id);
                else if (child.type === BookingType.FLIGHT) flightIds.push(child.id);
                else if (child.type === BookingType.VISA) visaIds.push(child.id);
            }
        }

        const subRelations = ['booking', 'booking.user', 'booking.user.account'];
        const [hotels, cars, flights, visas] = await Promise.all([
            hotelIds.length ? this.dataSource.getRepository(HotelBooking).find({ where: { bookingId: In(hotelIds) as any }, relations: subRelations }) : [],
            carIds.length ? this.dataSource.getRepository(CarBooking).find({ where: { bookingId: In(carIds) as any }, relations: subRelations }) : [],
            flightIds.length ? this.dataSource.getRepository(FlightBooking).find({ where: { bookingId: In(flightIds) as any }, relations: subRelations }) : [],
            visaIds.length ? this.dataSource.getRepository(VisaBooking).find({ where: { bookingId: In(visaIds) as any }, relations: subRelations }) : [],
        ]);

        const hotelMap = new Map(hotels.map((h) => [h.bookingId.toString(), h] as const));
        const carMap = new Map(cars.map((c) => [c.bookingId.toString(), c] as const));
        const flightMap = new Map(flights.map((f) => [f.bookingId.toString(), f] as const));
        const visaMap = new Map(visas.map((v) => [v.bookingId.toString(), v] as const));

        return bundles.map((bundle) => {
            const bundleHotels: HotelBooking[] = [];
            const bundleCars: CarBooking[] = [];
            const bundleFlights: FlightBooking[] = [];
            const bundleVisas: VisaBooking[] = [];

            for (const child of bundle.children ?? []) {
                const id = child.id.toString();
                if (child.type === BookingType.HOTEL) { const h = hotelMap.get(id); if (h) bundleHotels.push(h); }
                else if (child.type === BookingType.CAR) { const c = carMap.get(id); if (c) bundleCars.push(c); }
                else if (child.type === BookingType.FLIGHT) { const f = flightMap.get(id); if (f) bundleFlights.push(f); }
                else if (child.type === BookingType.VISA) { const v = visaMap.get(id); if (v) bundleVisas.push(v); }
            }

            return BundleMapper.fromEntities(bundle, {
                hotels: bundleHotels,
                cars: bundleCars,
                flights: bundleFlights,
                visas: bundleVisas,
            });
        });
    }

    async findAll(dto: BundleFilterDto): Promise<PaginatedResponseDto<BundleMapper>> {
        const [bundles, total] = await this.bundleRepository.findWithFilters(dto);
        const mapped = await this.buildMappersForBundles(bundles);
        return new PaginatedResponseDto(mapped, total, dto.page, dto.limit);
    }

    async findManyByIds(ids: bigint[]): Promise<BundleMapper[]> {
        const bundles = await this.bundleRepository.findManyWithBookings(ids);
        return this.buildMappersForBundles(bundles);
    }

    async findOne(id: bigint): Promise<BundleMapper> {
        const bundle = await this.bundleRepository.findOneWithBookings(id);
        if (!bundle) throw new NotFoundException('Bundle not found');
        const [mapper] = await this.buildMappersForBundles([bundle]);
        return mapper;
    }
}