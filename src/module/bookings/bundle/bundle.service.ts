import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager, In } from 'typeorm';
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
import { BookingStatus } from '../domain/enum/booking-status.enum';
import { UserProfile } from 'src/module/user/entity/user.entity';
import { CreateAllBookingsDto } from '../domain/dto/create-all-bookings.dto';
import { HotelBookingMapper } from '../services/hotel/mapper/hotel-booking.mapper';
import { CarBookingMapper } from '../services/car/mapper/car-booking.mapper';
import { FlightBookingMapper } from '../services/flight/mapper/flight-booking.mapper';
import { VisaBookingMapper } from '../services/visa/mapper/visa-booking.mapper';
import { BundleBase } from './entity/bundle-base.entity';
import { HotelBundle } from './entity/bundle-hotel.entity';
import { CarBundle } from './entity/bundle-car.entity';
import { FlightBundle } from './entity/bundle-flight.entity';
import { VisaBundle } from './entity/bundle-visa.entity';
import { findAllBundlesMapper } from './mapper/find-all-bundles.mapper';

export type CreatedBundleChildrenResult = {
    hotels: HotelBookingMapper[];
    cars: CarBookingMapper[];
    flights: FlightBookingMapper[];
    visas: VisaBookingMapper[];
};

@Injectable()
export class BundleService {
    constructor(
        private readonly bundleRepository: BundleRepository,
        private readonly dataSource: DataSource,
    ) { }

    async createBundle(
        accountId: bigint,
        dto: CreateAllBookingsDto,
    ): Promise<BundleMapper> {
        return await this.dataSource.transaction(async (manager) => {
            const createBooking = manager.create(Booking, {
                user: { accountId } as UserProfile,
                type: BookingType.BUNDLE,
                status: BookingStatus.DRAFT,
            });
            await manager.save(createBooking);
            const bundleBase = manager.create(BundleBase, {
                booking: createBooking,
                fingerPrintLocation: dto.bundleBase.fingerPrintLocation,
                companionsAdults: dto.bundleBase.companionsAdults,
                companionsChildren: dto.bundleBase.companionsChildren,
                numberOfTrips: dto.bundleBase.numberOfTrips,
            });
            await manager.save(bundleBase);

            const bundleId = bundleBase.bookingId;

            // Create hotel bundles
            const savedHotels: HotelBundle[] = [];
            for (const hotelDto of dto.hotels ?? []) {
                const hotel = manager.create(HotelBundle, BundleMapper.toHotelBundleEntity(bundleId, hotelDto));
                savedHotels.push(await manager.save(hotel));
            }

            // Create car bundles
            const savedCars: CarBundle[] = [];
            for (const carDto of dto.cars ?? []) {
                const car = manager.create(CarBundle, BundleMapper.toCarBundleEntity(bundleId, carDto));
                savedCars.push(await manager.save(car));
            }

            // Create flight bundles
            const savedFlights: FlightBundle[] = [];
            for (const flightDto of dto.flights ?? []) {
                const flight = manager.create(FlightBundle, BundleMapper.toFlightBundleEntity(bundleId, flightDto));
                savedFlights.push(await manager.save(flight));
            }

            // Create visa bundles
            const savedVisas: VisaBundle[] = [];
            for (const visaDto of dto.visas ?? []) {
                const visa = manager.create(VisaBundle, BundleMapper.toVisaBundleEntity(bundleId, visaDto));
                savedVisas.push(await manager.save(visa));
            }

            // Reload bundleBase with user relations for mapping
            const fullBundleBase = await manager.findOne(BundleBase, {
                where: { bookingId: bundleId as any },
                relations: ['booking', 'booking.user', 'booking.user.account'],
            });

            return BundleMapper.fromEntities(fullBundleBase!, {
                hotels: savedHotels,
                cars: savedCars,
                flights: savedFlights,
                visas: savedVisas,
            });
        });
    }


    async findAll(dto: BundleFilterDto): Promise<PaginatedResponseDto<findAllBundlesMapper>> {
        const [bundles, total] = await this.bundleRepository.findWithFilters(dto);
        const mapped = await Promise.all(bundles.map(async (bundle) => {
            return findAllBundlesMapper.toBaseBunddleResponse(bundle);
        }));
        return new PaginatedResponseDto(mapped, total, dto.page, dto.limit);
    }

    async findOne(id: bigint ,canChatbeEnabled: boolean, canOfficeAddOffers: boolean, canUserReviewBooking?: boolean): Promise<BundleMapper> {
        const bundle = await this.bundleRepository.findOneBundleWithDetails(id);
        if (!bundle) throw new NotFoundException('Bundle not found');
        const mapper = BundleMapper.fromEntities(bundle.baseBundle, {
            hotels: bundle.hotels,
            cars: bundle.cars,
            flights: bundle.flights,
            visas: bundle.visas,
        });
        return {
            ...mapper,
            canChatbeEnabled,
            canOfficeAddOffers,
            canUserReviewBooking,
        };
    }
}