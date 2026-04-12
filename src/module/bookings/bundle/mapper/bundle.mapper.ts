import { HotelBundleBookingMapper } from './hotel-bundle-booking.mapper';
import { CarBundleBookingMapper } from './car-bundle-booking.mapper';
import { FlightBundleBookingMapper } from './flight-bundle-booking.mapper';
import { VisaBundleBookingMapper } from './visa-bundle-booking.mapper';
import {
  CreateBundleBaseDto,
  CreateBundleCarBookingDto,
  CreateBundleFlightBookingDto,
  CreateBundleHotelBookingDto,
  CreateBundleVisaBookingDto,
} from '../dto/create-bundle-booking.dto';
import { BundleBase } from '../entity/bundle-base.entity';
import { HotelBundle } from '../entity/bundle-hotel.entity';
import { CarBundle } from '../entity/bundle-car.entity';
import { FlightBundle } from '../entity/bundle-flight.entity';
import { VisaBundle } from '../entity/bundle-visa.entity';
import { BookingType } from '../../domain/enum/booking-type.enum';

export class BundleMapper {
  id: bigint;
  type: BookingType;
  booking: {
        id: bigint;
        user: {
            accountId: bigint;
            name: string;
            account: {
                email: string ;
                phone: string ;
                status: string ;
            };
        };
        type: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
    }
  user: {
    accountId: bigint;
    name: string;
    account: {
      email: string ;
      phone: string ;
      status: string ;
    };
  };
  baseBundle: {
    bookingId: bigint;
    fingerPrintLocation: string;
    companionsAdults: number;
    companionsChildren: number;
    numberOfTrips: number;
  };
  hotels: HotelBundleBookingMapper[];
  cars: CarBundleBookingMapper[];
  flights: FlightBundleBookingMapper[];
  visas: VisaBundleBookingMapper[];
  canChatbeEnabled?: boolean;
  canOfficeAddOffers?: boolean;
  canUserReviewBooking?: boolean;

  static fromEntities(
    baseBundle: BundleBase,
    subEntities: {
      hotels: HotelBundle[];
      cars: CarBundle[];
      flights: FlightBundle[];
      visas: VisaBundle[];
    },
  ): BundleMapper {
    const booking = baseBundle.booking;
    const user = booking?.user;
    const account = user?.account;

    return {
      id: baseBundle.bookingId,
      type: BookingType.BUNDLE,
      booking: {
        id: booking?.id,
        user: {
          accountId: user?.accountId,
          name: user?.name ?? '',
          account: {
            email: account?.email ?? '',
            phone: account?.phone ?? '',
            status: account?.status ?? '',
          },
        },
        type: booking?.type,
        status: booking?.status,
        createdAt: booking?.createdAt,
        updatedAt: booking?.updatedAt,
      },
      user: {
        accountId: user?.accountId,
        name: user?.name ?? '',
        account: {
          email: account?.email ?? '',
          phone: account?.phone ?? '',
          status: account?.status ?? '',
        },
      },
      baseBundle: {
        bookingId: baseBundle.bookingId,
        fingerPrintLocation: baseBundle.fingerPrintLocation || '',
        companionsAdults: baseBundle.companionsAdults || 0,
        companionsChildren: baseBundle.companionsChildren || 0,
        numberOfTrips: baseBundle.numberOfTrips || 1,
      },
      hotels: subEntities.hotels.map(HotelBundleBookingMapper.toDto),
      cars: subEntities.cars.map(CarBundleBookingMapper.toDto),
      flights: subEntities.flights.map(FlightBundleBookingMapper.toDto),
      visas: subEntities.visas.map(VisaBundleBookingMapper.toDto),
    };
  }

  static toBundleBaseEntity(
    bookingId: bigint,
    dto: CreateBundleBaseDto,
  ): Partial<BundleBase> {
    return {
      bookingId,
      fingerPrintLocation: dto.fingerPrintLocation,
      companionsAdults: dto.companionsAdults ?? 0,
      companionsChildren: dto.companionsChildren ?? 0,
      numberOfTrips: dto.numberOfTrips ?? 1,
    };
  }

  static toHotelBundleEntity(
    bookingId: bigint,
    dto: CreateBundleHotelBookingDto,
  ): Partial<HotelBundle> {
    return {
      bundleBaseId: bookingId,
      isTherePreferredHotel: dto.isTherePreferredHotel,
      hotelName: dto.isTherePreferredHotel ? dto.preferredHotelName : '',
      starRating: dto.hotelStarRating || 0,
      roomDetails: dto.roomDetails,
      notes: dto.notes || '',
    };
  }

  static toCarBundleEntity(
    bookingId: bigint,
    dto: CreateBundleCarBookingDto,
  ): Partial<CarBundle> {
    return {
      bundleBaseId: bookingId,
      deliveryLocation: dto.deliveryLocation,
      deliveryDate: dto.deliveryDate,
      returnDate: dto.returnDate,
      carType: dto.carType,
      transmissionType: dto.transmissionType,
      carBrand: dto.carBrand,
      carModel: dto.carModel,
      hasDrivingLicense: dto.hasDrivingLicense,
      driverAge: dto.driverAge,
      drivingExperienceYears: dto.drivingExperienceYears,
      requiresPrivateDriver: dto.requiresPrivateDriver,
      requiresChildSeat: dto.requiresChildSeat,
      requiresFullInsurance: dto.requiresFullInsurance,
      notes: dto.notes || '',
      numberOfTrip: dto.numberOfTrip,
    };
  }

  static toFlightBundleEntity(
    bookingId: bigint,
    dto: CreateBundleFlightBookingDto,
  ): Partial<FlightBundle> {
    return {
      bundleBaseId: bookingId,
      ticketGrade: dto.ticketGrade,
    };
  }

  static toVisaBundleEntity(
    bookingId: bigint,
    dto: CreateBundleVisaBookingDto,
  ): Partial<VisaBundle> {
    return {
      bundleBaseId: bookingId,
      depretureCountry: dto.depretureCountry,
      arrivalCountry: dto.arrivalCountry,
      visaType: dto.visaType,
      departureDate: dto.departureDate,
      returnDate: dto.returnDate ?? null,
    };
  }
}
