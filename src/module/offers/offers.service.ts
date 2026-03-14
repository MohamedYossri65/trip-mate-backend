import { BadRequestException, Injectable } from '@nestjs/common';
import { BookingStatus } from '../bookings/domain/enum/booking-status.enum';
import { Offer } from './entity/offer.entity';
import { Brackets, DataSource } from 'typeorm';
import { Booking } from '../bookings/domain/entity/booking.entity';
import { CarOfferDetails } from './entity/car-offer-details';
import { CarOfferMapper } from './mapper/car-offer.mapper';
import { CreateCarOfferDto } from './dto/create-car-offer.dto';
import { BookingType } from '../bookings/domain/enum/booking-type.enum';
import { OfferStatus } from './enum/offer-status.enum';
import { OfferRepository } from './repository/offer.repository';
import { OfferFilterDto } from './dto/offer-filter.dto';
import { OfferMapper } from './mapper/offer-mapper.dto';
import { VisaOfferDetails } from './entity/visa-offer-details';
import { VisaOfferMapper } from './mapper/visa-offer.mapper';
import { CreateVisaOfferDto } from './dto/create-visa-offer.dto';
import { FlightOfferDetails } from './entity/flight-offer-details';
import { FlightOfferMapper } from './mapper/flight-offer.mapper';
import { CreateFlightOfferDto } from './dto/create-flight-offer.dto';
import { HotelOfferDetails } from './entity/hotel-offer-details';
import { HotelOfferMapper } from './mapper/hotel-offer.mapper';
import { CreateHotelOfferDto } from './dto/create-hotel-offer.dto';
import { BundleOfferDetails } from './entity/bundle-offer-details';
import { BundleOfferMapper } from './mapper/bundle-offer.mapper';
import { CreateBundleOfferDto } from './dto/create-bundle-offer.dto';
import { OfficeService } from '../office/office.service';
import { UpdateCarOfferDto } from './dto/update-car-offer.dto';
import { UpdateVisaOfferDto } from './dto/update-visa-offer.dto';
import { UpdateFlightOfferDto } from './dto/update-flight-offer.dto';
import { UpdateHotelOfferDto } from './dto/update-hotel-offer.dto';
import { UpdateBundleOfferDto } from './dto/update-bundle-offer.dto';

@Injectable()
export class OffersService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly offerRepository: OfferRepository,

    private readonly officeService: OfficeService,
  ) { }

  // ─── CAR ────────────────────────────────────────────────────────────────────

  async createCarRentalOffer(
    carOfferDetailsDto: CreateCarOfferDto,
    accountId: bigint,
  ): Promise<CarOfferMapper> {
    const carOfferResult = await this.dataSource.transaction(async (manager) => {
      const booking = await manager
        .createQueryBuilder(Booking, 'booking')
        .where('booking.id = :id', { id: carOfferDetailsDto.bookingId })
        .getOne();


      if (!booking) throw new BadRequestException('Booking not found');

      const hasPendingOfferFromOffice = await this.hasPendingOfferFromOffice(BigInt(carOfferDetailsDto.bookingId), accountId);

      if (hasPendingOfferFromOffice) {
        throw new BadRequestException('An offer from this office already exists for this booking');
      }

      const offer = manager.create(Offer, {
        booking,
        office: { accountId },
        price: carOfferDetailsDto.price,
        offerDuration: carOfferDetailsDto.offerDuration,
        arrivalCountry: carOfferDetailsDto.arrivalCountry,
        attachments: await this.savePathAttachments(carOfferDetailsDto.attachments || []),
      });

      await manager.save(offer);

      const carOfferDetails = manager.create(CarOfferDetails, {
        ...CarOfferMapper.fromDto(carOfferDetailsDto, offer),
      });

      await manager.save(carOfferDetails);

      if (booking.status === BookingStatus.WAITING_FOR_OFFERS) {
        booking.changeStatus(BookingStatus.UNDER_NEGOTIATION);
        await manager.save(booking);
      }

      return offer;
    });

    return this.findOneCarOffer(carOfferResult.id);
  }

  async findOneCarOffer(offerId: bigint): Promise<CarOfferMapper> {
    const carOfferDetails = await this.dataSource.getRepository(CarOfferDetails).findOne({
      where: { offerId },
      relations: [
        'offer',
        'offer.office',
        'offer.office.account',
        'offer.booking',
        'offer.booking.user',
        'offer.booking.user.account'
      ],
    });
    if (!carOfferDetails) throw new BadRequestException('Car offer not found');

    const canOfficeEditOffer = await this.canOfficeEditOffer(carOfferDetails.offer.booking.id, carOfferDetails.offer.office.accountId);

    const officeDetails = await this.officeService.getOfficeDetails(carOfferDetails.offer.office.accountId);

    return CarOfferMapper.fromEntities(carOfferDetails, canOfficeEditOffer, officeDetails);
  }

  async findCarOffersByBookingId(bookingId: bigint): Promise<CarOfferMapper[]> {
    const carOfferDetailsList = await this.dataSource.getRepository(CarOfferDetails).find({
      where: { offer: { booking: { id: bookingId } } },
      relations: [
        'offer',
        'offer.office',
        'offer.office.account',
        'offer.booking',
        'offer.booking.user',
        'offer.booking.user.account'
      ],
    });

    const offersWithOfficeDetails = await Promise.all(
      carOfferDetailsList.map(async (details) => {
        const officeId = details.offer.office.accountId;
        return await this.officeService.getOfficeDetails(officeId);
      })
    );

    return carOfferDetailsList.map(
      (details) => CarOfferMapper.fromEntities(details, false, offersWithOfficeDetails.find(
        office => office.officeId === details.offer.office.accountId))
    );
  }

  // ─── VISA ───────────────────────────────────────────────────────────────────

  async createVisaOffer(
    visaOfferDto: CreateVisaOfferDto,
    accountId: bigint,
  ): Promise<VisaOfferMapper> {
    const offerResult = await this.dataSource.transaction(async (manager) => {
      const booking = await manager
        .createQueryBuilder(Booking, 'booking')
        .where('booking.id = :id', { id: visaOfferDto.bookingId })
        .getOne();

      if (!booking) throw new BadRequestException('Booking not found');

      const hasPendingOfferFromOffice = await this.hasPendingOfferFromOffice(BigInt(visaOfferDto.bookingId), accountId);

      if (hasPendingOfferFromOffice) {
        throw new BadRequestException('An offer from this office already exists for this booking');
      }

      const offer = manager.create(Offer, {
        booking,
        office: { accountId },
        price: visaOfferDto.price,
        offerDuration: visaOfferDto.offerDuration,
        arrivalCountry: visaOfferDto.arrivalCountry,
        attachments: visaOfferDto.attachments || [],
      });

      await manager.save(offer);

      const visaOfferDetails = manager.create(VisaOfferDetails, {
        ...VisaOfferMapper.fromDto(visaOfferDto, offer),
      });

      await manager.save(visaOfferDetails);

      if (booking.status === BookingStatus.WAITING_FOR_OFFERS) {
        booking.changeStatus(BookingStatus.UNDER_NEGOTIATION);
        await manager.save(booking);
      }

      return offer;
    });

    return this.findOneVisaOffer(offerResult.id);
  }

  async findOneVisaOffer(offerId: bigint): Promise<VisaOfferMapper> {
    const visaOfferDetails = await this.dataSource.getRepository(VisaOfferDetails).findOne({
      where: { offerId },
      relations: [
        'offer',
        'offer.office',
        'offer.office.account',
        'offer.booking',
        'offer.booking.user',
        'offer.booking.user.account',
      ],
    });
    if (!visaOfferDetails) throw new BadRequestException('Visa offer not found');

    const canOfficeEditOffer = await this.canOfficeEditOffer(visaOfferDetails.offer.booking.id, visaOfferDetails.offer.office.accountId);

    const officeDetails = await this.officeService.getOfficeDetails(visaOfferDetails.offer.office.accountId);

    return VisaOfferMapper.fromEntities(visaOfferDetails, canOfficeEditOffer, officeDetails);
  }


  async findVisaOffersByBookingId(bookingId: bigint): Promise<VisaOfferMapper[]> {
    const visaOfferDetailsList = await this.dataSource.getRepository(VisaOfferDetails).find({
      where: { offer: { booking: { id: bookingId } } },
      relations: [
        'offer',
        'offer.office',
        'offer.office.account',
        'offer.booking',
        'offer.booking.user',
        'offer.booking.user.account'
      ],
    });

    const offersWithOfficeDetails = await Promise.all(
      visaOfferDetailsList.map(async (details) => {
        const officeId = details.offer.office.accountId;
        return await this.officeService.getOfficeDetails(officeId);
      })
    );

    return visaOfferDetailsList.map(
      (details) => VisaOfferMapper.fromEntities(details, false, offersWithOfficeDetails.find(
        office => office.officeId === details.offer.office.accountId))
    );
  }
  // ─── FLIGHT ─────────────────────────────────────────────────────────────────

  async createFlightOffer(
    flightOfferDto: CreateFlightOfferDto,
    accountId: bigint,
  ): Promise<FlightOfferMapper> {
    const offerResult = await this.dataSource.transaction(async (manager) => {
      const booking = await manager
        .createQueryBuilder(Booking, 'booking')
        .where('booking.id = :id', { id: flightOfferDto.bookingId })
        .getOne();

      if (!booking) throw new BadRequestException('Booking not found');

      const hasPendingOfferFromOffice = await this.hasPendingOfferFromOffice(BigInt(flightOfferDto.bookingId), accountId);

      if (hasPendingOfferFromOffice) {
        throw new BadRequestException('An offer from this office already exists for this booking');
      }

      const offer = manager.create(Offer, {
        booking,
        office: { accountId },
        price: flightOfferDto.price,
        offerDuration: flightOfferDto.offerDuration,
        arrivalCountry: flightOfferDto.arrivalCountry,
        attachments: await this.savePathAttachments(flightOfferDto.attachments || []),
      });

      await manager.save(offer);

      const flightOfferDetails = manager.create(FlightOfferDetails, {
        ...FlightOfferMapper.fromDto(flightOfferDto, offer),
      });

      await manager.save(flightOfferDetails);

      if (booking.status === BookingStatus.WAITING_FOR_OFFERS) {
        booking.changeStatus(BookingStatus.UNDER_NEGOTIATION);
        await manager.save(booking);
      }

      return offer;
    });

    return this.findOneFlightOffer(offerResult.id);
  }

  async findOneFlightOffer(offerId: bigint): Promise<FlightOfferMapper> {
    const flightOfferDetails = await this.dataSource.getRepository(FlightOfferDetails).findOne({
      where: { offerId },
      relations: [
        'offer',
        'offer.office',
        'offer.office.account',
        'offer.booking',
        'offer.booking.user',
        'offer.booking.user.account',
      ],
    });
    if (!flightOfferDetails) throw new BadRequestException('Flight offer not found');

    const canOfficeEditOffer = await this.canOfficeEditOffer(flightOfferDetails.offer.booking.id, flightOfferDetails.offer.office.accountId);

    const officeDetails = await this.officeService.getOfficeDetails(flightOfferDetails.offer.office.accountId);

    return FlightOfferMapper.fromEntities(flightOfferDetails, canOfficeEditOffer, officeDetails);
  }

  async findFlightOffersByBookingId(bookingId: bigint): Promise<FlightOfferMapper[]> {
    const flightOfferDetailsList = await this.dataSource.getRepository(FlightOfferDetails).find({
      where: { offer: { booking: { id: bookingId } } },
      relations: [
        'offer',
        'offer.office',
        'offer.office.account',
        'offer.booking',
        'offer.booking.user',
        'offer.booking.user.account'
      ],
    });

    const offersWithOfficeDetails = await Promise.all(
      flightOfferDetailsList.map(async (details) => {
        const officeId = details.offer.office.accountId;
        return await this.officeService.getOfficeDetails(officeId);
      })
    );

    return flightOfferDetailsList.map(
      (details) => FlightOfferMapper.fromEntities(details, false, offersWithOfficeDetails.find(
        office => office.officeId === details.offer.office.accountId))
    );
  }

  // ─── HOTEL ──────────────────────────────────────────────────────────────────

  async createHotelOffer(
    hotelOfferDto: CreateHotelOfferDto,
    accountId: bigint,
  ): Promise<HotelOfferMapper> {
    const offerResult = await this.dataSource.transaction(async (manager) => {
      const booking = await manager
        .createQueryBuilder(Booking, 'booking')
        .where('booking.id = :id', { id: hotelOfferDto.bookingId })
        .getOne();

      if (!booking) throw new BadRequestException('Booking not found');

      const hasPendingOfferFromOffice = await this.hasPendingOfferFromOffice(BigInt(hotelOfferDto.bookingId), accountId);

      if (hasPendingOfferFromOffice) {
        throw new BadRequestException('An offer from this office already exists for this booking');
      }

      const offer = manager.create(Offer, {
        booking,
        office: { accountId },
        price: hotelOfferDto.price,
        offerDuration: hotelOfferDto.offerDuration,
        arrivalCountry: hotelOfferDto.arrivalCountry,
        attachments: await this.savePathAttachments(hotelOfferDto.attachments || []),
      });

      await manager.save(offer);

      const hotelOfferDetails = manager.create(HotelOfferDetails, {
        ...HotelOfferMapper.fromDto(hotelOfferDto, offer),
      });

      await manager.save(hotelOfferDetails);

      if (booking.status === BookingStatus.WAITING_FOR_OFFERS) {
        booking.changeStatus(BookingStatus.UNDER_NEGOTIATION);
        await manager.save(booking);
      }

      return offer;
    });

    return this.findOneHotelOffer(offerResult.id);
  }

  async findOneHotelOffer(offerId: bigint): Promise<HotelOfferMapper> {
    const hotelOfferDetails = await this.dataSource.getRepository(HotelOfferDetails).findOne({
      where: { offerId },
      relations: [
        'offer',
        'offer.office',
        'offer.office.account',
        'offer.booking',
        'offer.booking.user',
        'offer.booking.user.account',
      ],
    });
    if (!hotelOfferDetails) throw new BadRequestException('Hotel offer not found');

    const canOfficeEditOffer = await this.canOfficeEditOffer(hotelOfferDetails.offer.booking.id, hotelOfferDetails.offer.office.accountId);
    const officeDetails = await this.officeService.getOfficeDetails(hotelOfferDetails.offer.office.accountId);

    return HotelOfferMapper.fromEntities(hotelOfferDetails, canOfficeEditOffer, officeDetails);
  }


  async findHotelOffersByBookingId(bookingId: bigint): Promise<HotelOfferMapper[]> {
    const hotelOfferDetailsList = await this.dataSource.getRepository(HotelOfferDetails).find({
      where: { offer: { booking: { id: bookingId } } },
      relations: [
        'offer',
        'offer.office',
        'offer.office.account',
        'offer.booking',
        'offer.booking.user',
        'offer.booking.user.account'
      ],
    });

    const offersWithOfficeDetails = await Promise.all(
      hotelOfferDetailsList.map(async (details) => {
        const officeId = details.offer.office.accountId;
        return await this.officeService.getOfficeDetails(officeId);
      })
    );

    return hotelOfferDetailsList.map(
      (details) => HotelOfferMapper.fromEntities(details, false, offersWithOfficeDetails.find(
        office => office.officeId === details.offer.office.accountId))
    );
  }

  // ─── BUNDLE ─────────────────────────────────────────────────────────────────

  async createBundleOffer(
    bundleOfferDto: CreateBundleOfferDto,
    accountId: bigint,
  ): Promise<BundleOfferMapper> {
    const offerResult = await this.dataSource.transaction(async (manager) => {
      const booking = await manager
        .createQueryBuilder(Booking, 'booking')
        .where('booking.id = :id', { id: bundleOfferDto.bookingId })
        .getOne();

      if (!booking) throw new BadRequestException('Booking not found');

      const hasPendingOfferFromOffice = await this.hasPendingOfferFromOffice(BigInt(bundleOfferDto.bookingId), accountId);

      if (hasPendingOfferFromOffice) {
        throw new BadRequestException('An offer from this office already exists for this booking');
      }

      const offer = manager.create(Offer, {
        booking,
        office: { accountId },
        price: bundleOfferDto.price,
        offerDuration: bundleOfferDto.offerDuration,
        arrivalCountry: bundleOfferDto.bundelDetails.visas?.[0]?.arrivalCountry || '',
        attachments: await this.savePathAttachments(bundleOfferDto.attachments || []),
      });

      await manager.save(offer);

      const bundleOfferDetails = manager.create(BundleOfferDetails, {
        ...BundleOfferMapper.fromDto(bundleOfferDto, offer),
      });

      await manager.save(bundleOfferDetails);

      if (booking.status === BookingStatus.WAITING_FOR_OFFERS) {
        booking.changeStatus(BookingStatus.UNDER_NEGOTIATION);
        await manager.save(booking);
      }

      return offer;
    });

    return this.findOneBundleOffer(offerResult.id);
  }

  async findOneBundleOffer(offerId: bigint): Promise<BundleOfferMapper> {
    const bundleOfferDetails = await this.dataSource.getRepository(BundleOfferDetails).findOne({
      where: { offerId },
      relations: [
        'offer',
        'offer.office',
        'offer.office.account',
        'offer.booking',
        'offer.booking.user',
        'offer.booking.user.account',
      ],
    });
    if (!bundleOfferDetails) throw new BadRequestException('Bundle offer not found');

    const canOfficeEditOffer = await this.canOfficeEditOffer(bundleOfferDetails.offer.booking.id, bundleOfferDetails.offer.office.accountId);
    const officeDetails = await this.officeService.getOfficeDetails(bundleOfferDetails.offer.office.accountId);

    return BundleOfferMapper.fromEntities(bundleOfferDetails, canOfficeEditOffer, officeDetails);
  }

  // ─── UPDATE METHODS ─────────────────────────────────────────────────────────

  private async findOfferForUpdate(offerId: bigint, accountId: bigint): Promise<Offer> {
    const offer = await this.dataSource.getRepository(Offer).findOne({
      where: { id: offerId },
      relations: ['booking', 'office'],
    });

    if (!offer) throw new BadRequestException('Offer not found');

    if (offer.office.accountId.toString() !== accountId.toString()) {
      throw new BadRequestException('You are not authorized to update this offer');
    }

    if (offer.status !== OfferStatus.PENDING) {
      throw new BadRequestException('Only pending offers can be updated');
    }

    if (offer.booking.status !== BookingStatus.UNDER_NEGOTIATION) {
      throw new BadRequestException('Offer can only be updated while booking is under negotiation');
    }

    return offer;
  }

  async updateCarOffer(
    offerId: bigint,
    dto: UpdateCarOfferDto,
    accountId: bigint,
  ): Promise<CarOfferMapper> {
    const offer = await this.findOfferForUpdate(offerId, accountId);

    await this.dataSource.transaction(async (manager) => {
      // Update offer-level fields
      if (dto.price !== undefined) offer.price = dto.price;
      if (dto.offerDuration !== undefined) offer.offerDuration = dto.offerDuration;
      if (dto.arrivalCountry !== undefined) offer.arrivalCountry = dto.arrivalCountry;
      if (dto.attachments !== undefined) offer.attachments = await this.savePathAttachments(dto.attachments);
      await manager.save(offer);

      // Update car-specific details
      const details = await manager.getRepository(CarOfferDetails).findOne({ where: { offerId } });
      if (!details) throw new BadRequestException('Car offer details not found');

      if (dto.arrivalCity !== undefined) details.arrivalCity = dto.arrivalCity;
      if (dto.deliveryLocation !== undefined) details.deliveryLocation = dto.deliveryLocation;
      if (dto.deliveryDate !== undefined) details.deliveryDate = dto.deliveryDate;
      if (dto.returnDate !== undefined) details.returnDate = dto.returnDate;
      if (dto.carType !== undefined) details.carType = dto.carType;
      if (dto.transmissionType !== undefined) details.transmissionType = dto.transmissionType;
      if (dto.carBrand !== undefined) details.carBrand = dto.carBrand;
      if (dto.carModel !== undefined) details.carModel = dto.carModel;
      if (dto.hasDrivingLicense !== undefined) details.hasDrivingLicense = dto.hasDrivingLicense;
      if (dto.driverAge !== undefined) details.driverAge = dto.driverAge;
      if (dto.drivingExperienceYears !== undefined) details.drivingExperienceYears = dto.drivingExperienceYears;
      if (dto.requiresPrivateDriver !== undefined) details.requiresPrivateDriver = dto.requiresPrivateDriver;
      if (dto.requiresChildSeat !== undefined) details.requiresChildSeat = dto.requiresChildSeat;
      if (dto.requiresFullInsurance !== undefined) details.requiresFullInsurance = dto.requiresFullInsurance;
      if (dto.notes !== undefined) details.notes = dto.notes;
      await manager.save(details);
    });

    return this.findOneCarOffer(offerId);
  }

  async updateVisaOffer(
    offerId: bigint,
    dto: UpdateVisaOfferDto,
    accountId: bigint,
  ): Promise<VisaOfferMapper> {
    const offer = await this.findOfferForUpdate(offerId, accountId);

    await this.dataSource.transaction(async (manager) => {
      if (dto.price !== undefined) offer.price = dto.price;
      if (dto.offerDuration !== undefined) offer.offerDuration = dto.offerDuration;
      if (dto.arrivalCountry !== undefined) offer.arrivalCountry = dto.arrivalCountry;
      if (dto.attachments !== undefined) offer.attachments = dto.attachments;
      await manager.save(offer);

      const details = await manager.getRepository(VisaOfferDetails).findOne({ where: { offerId } });
      if (!details) throw new BadRequestException('Visa offer details not found');

      if (dto.fingerPrintLocation !== undefined) details.fingerPrintLocation = dto.fingerPrintLocation;
      if (dto.visaType !== undefined) details.visaType = dto.visaType;
      if (dto.departureDate !== undefined) details.departureDate = dto.departureDate;
      if (dto.companionsAdults !== undefined) details.companionsAdults = dto.companionsAdults;
      if (dto.companionsChildren !== undefined) details.companionsChildren = dto.companionsChildren;
      if (dto.notes !== undefined) details.notes = dto.notes;
      await manager.save(details);
    });

    return this.findOneVisaOffer(offerId);
  }

  async updateFlightOffer(
    offerId: bigint,
    dto: UpdateFlightOfferDto,
    accountId: bigint,
  ): Promise<FlightOfferMapper> {
    const offer = await this.findOfferForUpdate(offerId, accountId);

    await this.dataSource.transaction(async (manager) => {
      if (dto.price !== undefined) offer.price = dto.price;
      if (dto.offerDuration !== undefined) offer.offerDuration = dto.offerDuration;
      if (dto.arrivalCountry !== undefined) offer.arrivalCountry = dto.arrivalCountry;
      if (dto.attachments !== undefined) offer.attachments = await this.savePathAttachments(dto.attachments);
      await manager.save(offer);

      const details = await manager.getRepository(FlightOfferDetails).findOne({ where: { offerId } });
      if (!details) throw new BadRequestException('Flight offer details not found');

      if (dto.departureCountry !== undefined) details.departureCountry = dto.departureCountry;
      if (dto.departureCity !== undefined) details.departureCity = dto.departureCity;
      if (dto.arrivalCity !== undefined) details.arrivalCity = dto.arrivalCity;
      if (dto.isRoundTrip !== undefined) details.isRoundTrip = dto.isRoundTrip;
      if (dto.departureDate !== undefined) details.departureDate = dto.departureDate;
      if (dto.returnDate !== undefined) details.returnDate = dto.returnDate;
      if (dto.hasVisa !== undefined) details.hasVisa = dto.hasVisa;
      if (dto.hasCompanions !== undefined) details.hasCompanions = dto.hasCompanions;
      if (dto.numberOfCompanions !== undefined) details.numberOfCompanions = dto.numberOfCompanions;
      if (dto.fullName !== undefined) details.fullName = dto.fullName;
      if (dto.dateOfBirth !== undefined) details.dateOfBirth = dto.dateOfBirth;
      if (dto.nationalIdNumber !== undefined) details.nationalIdNumber = dto.nationalIdNumber;
      if (dto.nationality !== undefined) details.nationality = dto.nationality;
      if (dto.hasPassport !== undefined) details.hasPassport = dto.hasPassport;
      if (dto.isYouTravelToThisCountryBefore !== undefined) details.isYouTravelToThisCountryBefore = dto.isYouTravelToThisCountryBefore;
      if (dto.isYourVisaRefusedBefore !== undefined) details.isYourVisaRefusedBefore = dto.isYourVisaRefusedBefore;
      if (dto.notes !== undefined) details.notes = dto.notes;
      await manager.save(details);
    });

    return this.findOneFlightOffer(offerId);
  }

  async updateHotelOffer(
    offerId: bigint,
    dto: UpdateHotelOfferDto,
    accountId: bigint,
  ): Promise<HotelOfferMapper> {
    const offer = await this.findOfferForUpdate(offerId, accountId);

    await this.dataSource.transaction(async (manager) => {
      if (dto.price !== undefined) offer.price = dto.price;
      if (dto.offerDuration !== undefined) offer.offerDuration = dto.offerDuration;
      if (dto.arrivalCountry !== undefined) offer.arrivalCountry = dto.arrivalCountry;
      if (dto.attachments !== undefined) offer.attachments = await this.savePathAttachments(dto.attachments);
      await manager.save(offer);

      const details = await manager.getRepository(HotelOfferDetails).findOne({ where: { offerId } });
      if (!details) throw new BadRequestException('Hotel offer details not found');

      if (dto.destinationCity !== undefined) details.destinationCity = dto.destinationCity;
      if (dto.isTherePreferredHotel !== undefined) details.isTherePreferredHotel = dto.isTherePreferredHotel;
      if (dto.hotelName !== undefined) details.hotelName = dto.hotelName;
      if (dto.starRating !== undefined) details.starRating = dto.starRating;
      if (dto.checkIn !== undefined) details.checkIn = dto.checkIn;
      if (dto.checkOut !== undefined) details.checkOut = dto.checkOut;
      if (dto.numGuests !== undefined) details.numGuests = dto.numGuests;
      if (dto.numChildren !== undefined) details.numChildren = dto.numChildren;
      if (dto.roomDetails !== undefined) details.roomDetails = dto.roomDetails;
      if (dto.notes !== undefined) details.notes = dto.notes;
      await manager.save(details);
    });

    return this.findOneHotelOffer(offerId);
  }
   
  async updateBundleOffer(
    offerId: bigint,
    dto: UpdateBundleOfferDto,
    accountId: bigint,
  ): Promise<BundleOfferMapper> {
    const offer = await this.findOfferForUpdate(offerId, accountId);

    await this.dataSource.transaction(async (manager) => {
      if (dto.price !== undefined) offer.price = dto.price;
      if (dto.offerDuration !== undefined) offer.offerDuration = dto.offerDuration;
      if (dto.arrivalCountry !== undefined) offer.arrivalCountry = dto.arrivalCountry;
      if (dto.attachments !== undefined) offer.attachments = await this.savePathAttachments(dto.attachments);
      await manager.save(offer);

      const details = await manager.getRepository(BundleOfferDetails).findOne({ where: { offerId } });
      if (!details) throw new BadRequestException('Bundle offer details not found');

      if (dto.bundelDetails !== undefined) details.bundelDetails = dto.bundelDetails;
      if (dto.notes !== undefined) details.notes = dto.notes;
      await manager.save(details);
    });

    return this.findOneBundleOffer(offerId);
  }

  // ─── SHARED ─────────────────────────────────────────────────────────────────

  async findOfficeOffers(officeId: bigint, dto: OfferFilterDto): Promise<OfferMapper[]> {
    const offerDetailsList = await this.offerRepository.findWithFilters(dto, officeId).then(([offers]) => offers);

    return offerDetailsList.map((offer) => {
      const canOfficeEditOffer =
        offer.office.accountId.toString() === officeId.toString() &&
        offer.status === OfferStatus.PENDING &&
        offer.booking.status === BookingStatus.UNDER_NEGOTIATION;
      return OfferMapper.fromEntities(offer, canOfficeEditOffer, null);
    });
  }


  private async hasPendingOfferFromOffice(
    bookingId: bigint,
    officeId: bigint
  ): Promise<boolean> {

    const existingOffer = await this.dataSource
      .getRepository(Offer)
      .findOne({
        where: {
          booking: { id: bookingId },
          office: { accountId: officeId },
          status: OfferStatus.PENDING
        },
      });

    return !!existingOffer;
  }

  async getOfferHomePage(officeId: bigint) {
    return await Promise.all([
      await this.findOfficeOffers(officeId, { limit: 3, page: 1, skip: 0, type: BookingType.FLIGHT, sortOrder: 'DESC' }),
      await this.findOfficeOffers(officeId, { limit: 3, page: 1, skip: 0, type: BookingType.HOTEL, sortOrder: 'DESC' }),
      await this.findOfficeOffers(officeId, { limit: 3, page: 1, skip: 0, type: BookingType.CAR, sortOrder: 'DESC' }),
      await this.findOfficeOffers(officeId, { limit: 3, page: 1, skip: 0, type: BookingType.VISA, sortOrder: 'DESC' }),
    ]).then(([FlightOffers, HotelOffers, CarOffers, VisaOffers]) => {
      return {
        FlightOffers,
        HotelOffers,
        CarOffers,
        VisaOffers
      }
    });
  }

  async findLastOfferPendingForUser(userId: bigint): Promise<OfferMapper | null> {
    const offerDetails = await this.offerRepository.findLastPendingOfferForUser(userId);
    if (!offerDetails) return null;
    const officeDetails = await this.officeService.getOfficeDetails(offerDetails.office.accountId);
    return OfferMapper.fromEntities(offerDetails, false ,officeDetails);
  }

  async savePathAttachments(attachments: string[]): Promise<string[]> {

    return attachments
      .filter((value) => typeof value === 'string' && value.trim().length > 0)
      .map((value) => {
        const normalizedValue = value.trim().replace(/\\/g, '/');

        const directTripMateIndex = normalizedValue.indexOf('/trip-mate');
        if (directTripMateIndex !== -1) {
          return normalizedValue.substring(directTripMateIndex);
        }

        try {
          const parsedUrl = new URL(normalizedValue);
          const path = parsedUrl.pathname;
          const tripMateIndex = path.indexOf('/trip-mate');
          return tripMateIndex !== -1 ? path.substring(tripMateIndex) : path;
        } catch {
          return normalizedValue.startsWith('/') ? normalizedValue : `/${normalizedValue}`;
        }
      });

  }


  async canOfficeAddOffer(bookingId: bigint, officeId: bigint): Promise<boolean> {
    const booking = await this.dataSource.getRepository(Booking).findOne({
      where: { id: bookingId },
    });
    if (!booking) throw new BadRequestException('Booking not found');

    if (booking.status !== BookingStatus.WAITING_FOR_OFFERS && booking.status !== BookingStatus.UNDER_NEGOTIATION) {
      return false;
    }
    const offer = await this.dataSource.getRepository(Offer).findOne({
      where: {
        booking: { id: bookingId },
        office: { accountId: officeId },
      },
    });

    if (offer && offer.status === OfferStatus.PENDING) {
      return false;
    }

    return true;
  }

  async canOfficeEditOffer(offerId: bigint, officeId: bigint): Promise<boolean> {
    const offer = await this.dataSource.getRepository(Offer).findOne({
      where: {
        id: offerId,
        office: { accountId: officeId },
      },
      relations: ['booking', 'office'],
    });
    if (offer && offer.booking.status === BookingStatus.UNDER_NEGOTIATION && offer.status === OfferStatus.PENDING) {
      return false;
    };
    return true;
  }

  async canChatbeEnabled(bookingId: bigint, officeId: bigint): Promise<boolean> {
    const booking = await this.dataSource.getRepository(Booking).findOne({
      where: { id: bookingId },
    });
    const offer = await this.dataSource.getRepository(Offer).findOne({
      where: {
        booking: { id: bookingId },
        office: { accountId: officeId },
      },
    });

    if (
      booking &&
      (
        booking.status === BookingStatus.PARTIALLY_PAID ||
        booking.status === BookingStatus.CONFIRMED ||
        booking.status === BookingStatus.COMPLETED
      ) &&
      !offer
    ) {
      return false;
    }
    return true;
  }
}
