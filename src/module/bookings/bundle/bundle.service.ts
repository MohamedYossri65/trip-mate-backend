import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import { BundleRepository } from './repository/bundle.repository';
import { BundleFilterDto } from './dto/bundle-filter.dto';
import { BundleMapper } from './mapper/bundle.mapper';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { BookingType } from '../enum/booking-type.enum';
import { HotelBooking } from '../hotel/entity/hotel-booking.entity';
import { CarBooking } from '../car/entity/car-booking.entity';
import { FlightBooking } from '../flight/entity/flight.-booking.entity';
import { VisaBooking } from '../visa/entity/visa-booking.entity';

@Injectable()
export class BundleService {
    constructor(
        private readonly bundleRepository: BundleRepository,
        private readonly dataSource: DataSource,
    ) { }

    async findAll(dto: BundleFilterDto): Promise<PaginatedResponseDto<BundleMapper>> {
        const [bundles, total] = await this.bundleRepository.findWithFilters(dto);

        if (!bundles.length) {
            return new PaginatedResponseDto([], total, dto.page, dto.limit);
        }

        // Collect booking IDs per type across all bundles
        const hotelIds: bigint[] = [];
        const carIds: bigint[] = [];
        const flightIds: bigint[] = [];
        const visaIds: bigint[] = [];

        for (const bundle of bundles) {
            for (const booking of bundle.bookings ?? []) {
                if (booking.type === BookingType.HOTEL) hotelIds.push(booking.id);
                else if (booking.type === BookingType.CAR) carIds.push(booking.id);
                else if (booking.type === BookingType.FLIGHT) flightIds.push(booking.id);
                else if (booking.type === BookingType.VISA) visaIds.push(booking.id);
            }
        }

        // Batch-load all sub-entities in parallel
        const [hotels, cars, flights, visas] = await Promise.all([
            hotelIds.length
                ? this.dataSource.getRepository(HotelBooking).find({
                    where: { bookingId: In(hotelIds) as any },
                    relations: ['booking', 'booking.user', 'booking.user.account'],
                })
                : [],
            carIds.length
                ? this.dataSource.getRepository(CarBooking).find({
                    where: { bookingId: In(carIds) as any },
                    relations: ['booking', 'booking.user', 'booking.user.account'],
                })
                : [],
            flightIds.length
                ? this.dataSource.getRepository(FlightBooking).find({
                    where: { bookingId: In(flightIds) as any },
                    relations: ['booking', 'booking.user', 'booking.user.account'],
                })
                : [],
            visaIds.length
                ? this.dataSource.getRepository(VisaBooking).find({
                    where: { bookingId: In(visaIds) as any },
                    relations: ['booking', 'booking.user', 'booking.user.account'],
                })
                : [],
        ]);

        // Build lookup maps by bookingId for O(1) stitching
        const hotelMap = new Map(hotels.map((h) => [h.bookingId.toString(), h] as const));
        const carMap = new Map(cars.map((c) => [c.bookingId.toString(), c] as const));
        const flightMap = new Map(flights.map((f) => [f.bookingId.toString(), f] as const));
        const visaMap = new Map(visas.map((v) => [v.bookingId.toString(), v] as const));

        const mapped = bundles.map((bundle) => {
            const bundleHotels: HotelBooking[] = [];
            const bundleCars: CarBooking[] = [];
            const bundleFlights: FlightBooking[] = [];
            const bundleVisas: VisaBooking[] = [];

            for (const booking of bundle.bookings ?? []) {
                const id = booking.id.toString();
                if (booking.type === BookingType.HOTEL) { const h = hotelMap.get(id); if (h) bundleHotels.push(h); }
                else if (booking.type === BookingType.CAR) { const c = carMap.get(id); if (c) bundleCars.push(c); }
                else if (booking.type === BookingType.FLIGHT) { const f = flightMap.get(id); if (f) bundleFlights.push(f); }
                else if (booking.type === BookingType.VISA) { const v = visaMap.get(id); if (v) bundleVisas.push(v); }
            }

            return BundleMapper.fromEntities(bundle, {
                hotels: bundleHotels,
                cars: bundleCars,
                flights: bundleFlights,
                visas: bundleVisas,
            });
        });

        return new PaginatedResponseDto(mapped, total, dto.page, dto.limit);
    }

    async findOne(id: bigint): Promise<BundleMapper> {
        const bundle = await this.bundleRepository.findOneWithBookings(id);

        if (!bundle) {
            throw new NotFoundException('Bundle not found');
        }

        const hotelIds: bigint[] = [];
        const carIds: bigint[] = [];
        const flightIds: bigint[] = [];
        const visaIds: bigint[] = [];

        for (const booking of bundle.bookings ?? []) {
            if (booking.type === BookingType.HOTEL) hotelIds.push(booking.id);
            else if (booking.type === BookingType.CAR) carIds.push(booking.id);
            else if (booking.type === BookingType.FLIGHT) flightIds.push(booking.id);
            else if (booking.type === BookingType.VISA) visaIds.push(booking.id);
        }

        const [hotels, cars, flights, visas] = await Promise.all([
            hotelIds.length
                ? this.dataSource.getRepository(HotelBooking).find({
                    where: { bookingId: In(hotelIds) as any },
                    relations: ['booking', 'booking.user', 'booking.user.account'],
                })
                : [],
            carIds.length
                ? this.dataSource.getRepository(CarBooking).find({
                    where: { bookingId: In(carIds) as any },
                    relations: ['booking', 'booking.user', 'booking.user.account'],
                })
                : [],
            flightIds.length
                ? this.dataSource.getRepository(FlightBooking).find({
                    where: { bookingId: In(flightIds) as any },
                    relations: ['booking', 'booking.user', 'booking.user.account'],
                })
                : [],
            visaIds.length
                ? this.dataSource.getRepository(VisaBooking).find({
                    where: { bookingId: In(visaIds) as any },
                    relations: ['booking', 'booking.user', 'booking.user.account'],
                })
                : [],
        ]);

        const hotelMap = new Map(hotels.map((h) => [h.bookingId.toString(), h] as const));
        const carMap = new Map(cars.map((c) => [c.bookingId.toString(), c] as const));
        const flightMap = new Map(flights.map((f) => [f.bookingId.toString(), f] as const));
        const visaMap = new Map(visas.map((v) => [v.bookingId.toString(), v] as const));

        const bundleHotels: HotelBooking[] = [];
        const bundleCars: CarBooking[] = [];
        const bundleFlights: FlightBooking[] = [];
        const bundleVisas: VisaBooking[] = [];

        for (const booking of bundle.bookings ?? []) {
            const bookingId = booking.id.toString();

            if (booking.type === BookingType.HOTEL) {
                const h = hotelMap.get(bookingId);
                if (h) bundleHotels.push(h);
            } else if (booking.type === BookingType.CAR) {
                const c = carMap.get(bookingId);
                if (c) bundleCars.push(c);
            } else if (booking.type === BookingType.FLIGHT) {
                const f = flightMap.get(bookingId);
                if (f) bundleFlights.push(f);
            } else if (booking.type === BookingType.VISA) {
                const v = visaMap.get(bookingId);
                if (v) bundleVisas.push(v);
            }
        }

        return BundleMapper.fromEntities(bundle, {
            hotels: bundleHotels,
            cars: bundleCars,
            flights: bundleFlights,
            visas: bundleVisas,
        });
    }
}
