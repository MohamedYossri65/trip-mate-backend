import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Booking } from './entity/booking.entity';
import { BookingType } from './enum/booking-type.enum';
import { BookingStatus } from './enum/booking-status.enum';
import { HotelBooking } from './hotel/entity/hotel-booking.entity';
import { CreateHotelBookingDto } from './hotel/dto/create-hotel-booking.dto';
import { HotelBookingMapper } from './hotel/mapper/hotel-booking.mapper';
import { UserProfile } from '../user/entity/user.entity';
import { CreateCarBookingDto } from './car/dto/create-car-booking.dto';
import { CarBookingMapper } from './car/mapper/car-booking.mapper';
import { CarBooking } from './car/entity/car-booking.entity';
import { CreateFlightBookingDto } from './flight/dto/create-flight-booking.dto';
import { FlightBookingMapper } from './flight/mapper/flight-booking.mapper';
import { FlightBooking } from './flight/entity/flight.-booking.entity';
import { CreateVisaBookingDto } from './visa/dto/create-visa.dto';
import { VisaBookingMapper } from './visa/mapper/visa-booking.mapper';
import { VisaBooking } from './visa/entity/visa-booking.entity';
import { HotelService } from './hotel/hotel.service';
import { HotelFilterDto } from './hotel/dto/hotel-filter.dto';
import { FlightService } from './flight/flight.service';
import { FlightFilterDto } from './flight/dto/flight-filter.dto';
import { CarService } from './car/car.service';
import { CarFilterDto } from './car/dto/car-filter.dto';
import { VisaService } from './visa/visa.service';
import { VisaFilterDto } from './visa/dto/visa-filter.dto';
import { BookingRepository } from './repository/booking.repository';
import { CreateAllBookingsDto } from './dto/create-all-bookings.dto';
import { BundleService } from './bundle/bundle.service';
import { BundleFilterDto } from './bundle/dto/bundle-filter.dto';
import { Bundle } from './entity/bundle.entity';
import { In } from 'typeorm';
import { BundleMapper } from './bundle/mapper/bundle.mapper';

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
  ) { }

  // Each createXBooking method follows the same pattern:
  async createHotelBooking(
    accountId: string,
    dto: CreateHotelBookingDto,
  ): Promise<HotelBookingMapper> {
    const hotelDetails = await this.dataSource.transaction(async (manager) => {
      // 0️⃣ resolve UserProfile from account ID
      const userProfile = await manager.findOne(UserProfile, {
        where: { account: { id: BigInt(accountId) } },
      });
      if (!userProfile) throw new NotFoundException('User profile not found');

      // 1️⃣ create booking
      const booking = manager.create(Booking, {
        user: { id: userProfile.id },
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
      });
      if (!userProfile) throw new NotFoundException('User profile not found');

      // 1️⃣ create booking
      const booking = manager.create(Booking, {
        user: { id: userProfile.id },
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
      });
      if (!userProfile) throw new NotFoundException('User profile not found');

      // 1️⃣ create booking
      const booking = manager.create(Booking, {
        user: { id: userProfile.id },
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
      });
      if (!userProfile) throw new NotFoundException('User profile not found');

      // 1️⃣ create booking
      const booking = manager.create(Booking, {
        user: { id: userProfile.id },
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
      Promise.all((dto.hotels ?? []).map((h) => this.createHotelBooking(accountId.toString(), h))),
      Promise.all((dto.cars ?? []).map((c) => this.createCarBooking(accountId, c))),
      Promise.all((dto.flights ?? []).map((f) => this.createFlightBooking(accountId, f))),
      Promise.all((dto.visas ?? []).map((v) => this.createVisaBooking(accountId, v))),
    ]);

    const allResults = [...hotels, ...cars, ...flights, ...visas];
    if (!allResults.length) throw new BadRequestException('At least one booking must be provided');

    // Resolve UserProfile
    const userProfile = await this.dataSource.getRepository(UserProfile).findOne({
      where: { account: { id: accountId } },
    });
    if (!userProfile) throw new NotFoundException('User profile not found');

    // Create a Bundle to group these bookings together
    const bundle = this.dataSource.getRepository(Bundle).create({ user: userProfile });
    await this.dataSource.getRepository(Bundle).save(bundle);

    // Link every created Booking record to this bundle
    const bookingIds: bigint[] = allResults.map((r: any) => r.booking.id);
    await this.dataSource
      .createQueryBuilder()
      .update(Booking)
      .set({ bundle: { id: bundle.id } })
      .whereInIds(bookingIds)
      .execute();

    return { bundleId: bundle.id, hotels, cars, flights, visas };
  }

  // Getters for bookings for officers would go here

  async findAllBooking(dto: any) {
    return this.bookingRepository.findWithFilters(dto);
  }

  async findAllBundles(dto: BundleFilterDto) {
    return this.bundleService.findAll(dto);
  }

  async findOneBundle(bundleId: bigint): Promise<BundleMapper> {
    return this.bundleService.findOne(bundleId);
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

  
}
