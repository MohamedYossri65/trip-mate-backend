import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import { Booking } from './domain/entity/booking.entity';
import { BookingType } from './domain/enum/booking-type.enum';
import { BookingStatus } from './domain/enum/booking-status.enum';
import { HotelBooking } from './services/hotel/entity/hotel-booking.entity';
import { CreateHotelBookingDto } from './services/hotel/dto/create-hotel-booking.dto';
import { HotelBookingMapper } from './services/hotel/mapper/hotel-booking.mapper';
import { UserProfile } from '../user/entity/user.entity';
import { CreateCarBookingDto } from './services/car/dto/create-car-booking.dto';
import { CarBookingMapper } from './services/car/mapper/car-booking.mapper';
import { CarBooking } from './services/car/entity/car-booking.entity';
import { CreateFlightBookingDto } from './services/flight/dto/create-flight-booking.dto';
import { FlightBookingMapper } from './services/flight/mapper/flight-booking.mapper';
import { FlightBooking } from './services/flight/entity/flight.-booking.entity';
import { CreateVisaBookingDto } from './services/visa/dto/create-visa.dto';
import { VisaBookingMapper } from './services/visa/mapper/visa-booking.mapper';
import { VisaBooking } from './services/visa/entity/visa-booking.entity';
import { HotelService } from './services/hotel/hotel.service';
import { HotelFilterDto } from './services/hotel/dto/hotel-filter.dto';
import { FlightService } from './services/flight/flight.service';
import { FlightFilterDto } from './services/flight/dto/flight-filter.dto';
import { CarService } from './services/car/car.service';
import { CarFilterDto } from './services/car/dto/car-filter.dto';
import { VisaService } from './services/visa/visa.service';
import { VisaFilterDto } from './services/visa/dto/visa-filter.dto';
import { BookingRepository } from './domain/repository/booking.repository';
import { CreateAllBookingsDto } from './domain/dto/create-all-bookings.dto';
import { BundleService } from './bundle/bundle.service';
import { BundleFilterDto } from './bundle/dto/bundle-filter.dto';
import { BundleMapper } from './bundle/mapper/bundle.mapper';
import { FindHomePageMapper } from './domain/mapper/find-home-page-mapper';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { BookingFilterDto } from './domain/dto/booking-filter.dto';
import { BookingMapper } from './domain/mapper/booking.mapper';
import { Account } from '../account/entity/account.entity';
import { RolesEnum } from 'src/common/enums/roles.enum';
import { OffersService } from '../offers/offers.service';
import { MyBookingFilterDto } from './domain/dto/my-booking-filter.dto';
import { OfficeService } from '../office/office.service';
import { ReviewService } from '../review/review.service';

@Injectable()
export class BookingsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly hotelService: HotelService,
    private readonly flightService: FlightService,
    private readonly carService: CarService,
    private readonly visaService: VisaService,
    private readonly bundleService: BundleService,
    private readonly bookingRepository: BookingRepository,
    private readonly offerService: OffersService,
    private readonly reviewService: ReviewService,
  ) { }

  // Each createXBooking method follows the same pattern:
  async createHotelBooking(
    accountId: bigint,
    dto: CreateHotelBookingDto,
  ): Promise<HotelBookingMapper> {
    const hotelDetails = await this.dataSource.transaction(async (manager) => {
      // 0️⃣ resolve UserProfile from account ID
      const userProfile = await manager.findOne(UserProfile, {
        where: { account: { id: accountId } },
        relations: ['account'],
      });
      if (!userProfile) throw new NotFoundException('User profile not found');

      // 1️⃣ create booking
      const booking = manager.create(Booking, {
        user: { accountId: userProfile.accountId },
        type: BookingType.HOTEL,
        status: BookingStatus.DRAFT,
      });

      await manager.save(booking);
      booking.user = userProfile; // attach full userProfile (with eager account) for mapper

      // 2️⃣ create hotel details
      const hotelDetails = manager.create(
        HotelBooking,
        HotelBookingMapper.fromDto(dto, booking),
      );

      await manager.save(hotelDetails);

      // 3️⃣ move status
      booking.changeStatus(BookingStatus.WAITING_FOR_OFFERS);
      await manager.save(booking);

      hotelDetails.booking = booking;
      return hotelDetails;
    });

    return HotelBookingMapper.fromEntities(hotelDetails);
  }

  async createCarBooking(
    accountId: bigint,
    dto: CreateCarBookingDto,
  ): Promise<CarBookingMapper> {
    const carDetails = await this.dataSource.transaction(async (manager) => {
      // 0️⃣ resolve UserProfile from account ID
      const userProfile = await manager.findOne(UserProfile, {
        where: { account: { id: accountId } },
        relations: ['account'],
      });
      if (!userProfile) throw new NotFoundException('User profile not found');

      // 1️⃣ create booking
      const booking = manager.create(Booking, {
        user: { accountId: userProfile.accountId },
        type: BookingType.CAR,
        status: BookingStatus.DRAFT,
      });

      await manager.save(booking);
      booking.user = userProfile; // attach full userProfile (with eager account) for mapper

      // 2️⃣ create car details
      const carDetails = manager.create(
        CarBooking,
        CarBookingMapper.fromDto(dto, booking),
      );

      await manager.save(carDetails);

      // 3️⃣ move status
      booking.changeStatus(BookingStatus.WAITING_FOR_OFFERS);
      await manager.save(booking);

      carDetails.booking = booking;
      return carDetails;
    });

    return CarBookingMapper.fromEntities(carDetails);
  }

  async createFlightBooking(
    accountId: bigint,
    dto: CreateFlightBookingDto,
  ): Promise<FlightBookingMapper> {
    const flightDetails = await this.dataSource.transaction(async (manager) => {
      // 0️⃣ resolve UserProfile from account ID
      const userProfile = await manager.findOne(UserProfile, {
        where: { account: { id: accountId } },
        relations: ['account'],
      });
      if (!userProfile) throw new NotFoundException('User profile not found');

      // 1️⃣ create booking
      const booking = manager.create(Booking, {
        user: { accountId: userProfile.accountId },
        type: BookingType.FLIGHT,
        status: BookingStatus.DRAFT,
      });

      await manager.save(booking);
      booking.user = userProfile;

      // 2️⃣ create flight details
      const flightDetails = manager.create(
        FlightBooking,
        FlightBookingMapper.fromDto(dto, booking),
      );

      await manager.save(flightDetails);

      // 3️⃣ move status
      booking.changeStatus(BookingStatus.WAITING_FOR_OFFERS);
      await manager.save(booking);

      flightDetails.booking = booking;
      return flightDetails;
    });

    return FlightBookingMapper.fromEntities(flightDetails);
  }

  async createVisaBooking(
    accountId: bigint,
    dto: CreateVisaBookingDto,
  ): Promise<VisaBookingMapper> {
    const visaDetails = await this.dataSource.transaction(async (manager) => {
      // 0️⃣ resolve UserProfile from account ID
      const userProfile = await manager.findOne(UserProfile, {
        where: { account: { id: accountId } },
        relations: ['account'],
      });
      if (!userProfile) throw new NotFoundException('User profile not found');

      // 1️⃣ create booking
      const booking = manager.create(Booking, {
        user: { accountId: userProfile.accountId },
        type: BookingType.VISA,
        status: BookingStatus.DRAFT,
      });

      await manager.save(booking);
      booking.user = userProfile;

      // 2️⃣ create visa details
      const visaDetails = manager.create(
        VisaBooking,
        VisaBookingMapper.fromDto(dto, booking),
      );

      await manager.save(visaDetails);

      // 3️⃣ move status
      booking.changeStatus(BookingStatus.WAITING_FOR_OFFERS);
      await manager.save(booking);

      visaDetails.booking = booking;
      return visaDetails;
    });

    return VisaBookingMapper.fromEntities(visaDetails);
  }

  async createAllBookings(
    accountId: bigint,
    dto: CreateAllBookingsDto,
  ): Promise<{
    bundleId: bigint;
    hotels: HotelBookingMapper[];
    cars: CarBookingMapper[];
    flights: FlightBookingMapper[];
    visas: VisaBookingMapper[];
  }> {
    const [hotels, cars, flights, visas] = await Promise.all([
      await Promise.all((dto.hotels ?? []).map((h) => this.createHotelBooking(accountId, h))),
      await Promise.all((dto.cars ?? []).map((c) => this.createCarBooking(accountId, c))),
      await Promise.all((dto.flights ?? []).map((f) => this.createFlightBooking(accountId, f))),
      await Promise.all((dto.visas ?? []).map((v) => this.createVisaBooking(accountId, v))),
    ]);

    const allResults = [...hotels, ...cars, ...flights, ...visas];
    if (!allResults.length) throw new BadRequestException('At least one booking must be provided');

    // Resolve UserProfile
    const userProfile = await this.dataSource.getRepository(UserProfile).findOne({
      where: { account: { id: accountId } },
    });
    if (!userProfile) throw new NotFoundException('User profile not found');

    // Create a BUNDLE booking to group these child bookings together
    const bundleBooking = this.dataSource.getRepository(Booking).create({
      user: { accountId: userProfile.accountId },
      type: BookingType.BUNDLE,
      status: BookingStatus.WAITING_FOR_OFFERS,
    });
    await this.dataSource.getRepository(Booking).save(bundleBooking);

    // Link every created Booking record to this bundle booking via parent_id
    const bookingIds: bigint[] = allResults.map((r: any) => r.booking.id);
    await this.dataSource
      .createQueryBuilder()
      .update(Booking)
      .set({ parent: { id: bundleBooking.id } })
      .whereInIds(bookingIds)
      .execute();

    return { bundleId: bundleBooking.id, hotels, cars, flights, visas };
  }

  // Getters for bookings for officers would go here

  async findAllBundles(dto: BundleFilterDto) {
    return this.bundleService.findAll(dto);
  }

  async findAllHotels(dto: HotelFilterDto) {
    return this.hotelService.findAll(dto);
  }

  async findAllFlights(dto: FlightFilterDto) {
    return this.flightService.findAll(dto);
  }

  async findAllCars(dto: CarFilterDto) {
    return this.carService.findAll(dto);
  }

  async findAllVisas(dto: VisaFilterDto) {
    return this.visaService.findAll(dto);
  }

  async findOneBundle(bundleId: bigint, account: Account): Promise<BundleMapper> {
    const canOfficeAddOffers = await this.offerService.canOfficeAddOffer(bundleId, account.id);
    const canChatbeEnabled = await this.offerService.canChatbeEnabled(bundleId, account.id);
    const canUserReviewBooking = await this.reviewService.canUserReviewBooking(account.id, bundleId);
    return this.bundleService.findOne(bundleId, canChatbeEnabled, canOfficeAddOffers, canUserReviewBooking);
  }

  async findHomePageBookings(arrivalCountry?: string) {
    const [hotels, cars, flights, visas, bundles] = await Promise.all([
      await this.hotelService.findAll({ page: 1, skip: 0, limit: 3, sortBy: 'createdAt', sortOrder: 'DESC', arrivalCountry }),
      await this.carService.findAll({ page: 1, skip: 0, limit: 3, sortBy: 'createdAt', sortOrder: 'DESC', arrivalCountry }),
      await this.flightService.findAll({ page: 1, skip: 0, limit: 3, sortBy: 'createdAt', sortOrder: 'DESC', arrivalCountry }),
      await this.visaService.findAll({ page: 1, skip: 0, limit: 3, sortBy: 'createdAt', sortOrder: 'DESC', arrivalCountry }),
      await this.bundleService.findAll({ page: 1, skip: 0, limit: 3, sortBy: 'createdAt', sortOrder: 'DESC' }),
    ]);
    return FindHomePageMapper.fromEntities(
      bundles.data ?? [],
      hotels.data ?? [],
      cars.data ?? [],
      visas.data ?? [],
      flights.data ?? [],
    );
  }

  async findOneHotelBooking(bookingId: bigint, account: Account): Promise<HotelBookingMapper | null> {
    const entity = await this.hotelService.findOneByBookingId(bookingId);
    if (!entity) return null;
    if (account.role === RolesEnum.OFFICE) {
      const canOfficeAddOffers = await this.offerService.canOfficeAddOffer(bookingId, account.id);
      const canChatbeEnabled = await this.offerService.canChatbeEnabled(bookingId, account.id);
      return { ...entity, canOfficeAddOffers, canChatbeEnabled };
    } else if (account.role === RolesEnum.USER) {
      const canUserReviewBooking = await this.reviewService.canUserReviewBooking(account.id, bookingId);
      return { ...entity, canUserReviewBooking };
    }
    return entity;
  }

  async findOneCarBooking(bookingId: bigint, account: Account): Promise<CarBookingMapper | null> {
    const entity = await this.carService.findOneByBookingId(bookingId);
    if (!entity) return null;
    if (account.role === RolesEnum.OFFICE) {
      const canOfficeAddOffers = await this.offerService.canOfficeAddOffer(bookingId, account.id);
      const canChatbeEnabled = await this.offerService.canChatbeEnabled(bookingId, account.id);
      return { ...entity, canOfficeAddOffers, canChatbeEnabled };
    } else if (account.role === RolesEnum.USER) {
      const canUserReviewBooking = await this.reviewService.canUserReviewBooking(account.id, bookingId);
      return { ...entity, canUserReviewBooking };
    }
    return entity;
  }

  async findOneFlightBooking(bookingId: bigint, account: Account): Promise<FlightBookingMapper | null> {
    const entity = await this.flightService.findOneByBookingId(bookingId);
    if (!entity) return null;
    if (account.role === RolesEnum.OFFICE) {
      const canOfficeAddOffers = await this.offerService.canOfficeAddOffer(bookingId, account.id);
      const canChatbeEnabled = await this.offerService.canChatbeEnabled(bookingId, account.id);
      return { ...entity, canOfficeAddOffers, canChatbeEnabled };
    } else if (account.role === RolesEnum.USER) {
      const canUserReviewBooking = await this.reviewService.canUserReviewBooking(account.id, bookingId);
      return { ...entity, canUserReviewBooking };
    }
    return entity;
  }

  async findOneVisaBooking(bookingId: bigint, account: Account): Promise<VisaBookingMapper | null> {
    const entity = await this.visaService.findOneByBookingId(bookingId);
    if (!entity) return null;
    if (account.role === RolesEnum.OFFICE) {
      const canOfficeAddOffers = await this.offerService.canOfficeAddOffer(bookingId, account.id);
      const canChatbeEnabled = await this.offerService.canChatbeEnabled(bookingId, account.id);
      return { ...entity, canOfficeAddOffers, canChatbeEnabled };
    } else if (account.role === RolesEnum.USER) {
      const canUserReviewBooking = await this.reviewService.canUserReviewBooking(account.id, bookingId);
      return { ...entity, canUserReviewBooking };
    }
    return entity;
  }

  async findUserBookings(accountId: bigint, dto: MyBookingFilterDto): Promise<PaginatedResponseDto<BookingMapper>> {
    const [bookings, total] = await this.bookingRepository.findUserBookings(accountId, dto);
    const mapped = bookings.map((booking) => {
      const bookingMapper = BookingMapper.fromEntities(booking);
      if (booking.status !== BookingStatus.COMPLETED) {
        bookingMapper.status = 'PENDING';
      } else {
        bookingMapper.status = 'COMPLETED';
      }
      return bookingMapper;
    });
    return new PaginatedResponseDto(mapped, total, dto.page, dto.limit);
  }
}
