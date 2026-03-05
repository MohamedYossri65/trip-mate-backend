import { Booking } from '../../domain/entity/booking.entity';
import { HotelBooking } from '../../services/hotel/entity/hotel-booking.entity';
import { CarBooking } from '../../services/car/entity/car-booking.entity';
import { FlightBooking } from '../../services/flight/entity/flight.-booking.entity';
import { VisaBooking } from '../../services/visa/entity/visa-booking.entity';
import { HotelBookingMapper } from '../../services/hotel/mapper/hotel-booking.mapper';
import { CarBookingMapper } from '../../services/car/mapper/car-booking.mapper';
import { FlightBookingMapper } from '../../services/flight/mapper/flight-booking.mapper';
import { VisaBookingMapper } from '../../services/visa/mapper/visa-booking.mapper';

export class BundleMapper {
  id: bigint;
  user: {
    accountId: bigint;
    name: string;
    account: {
      email: string;
      phone: string;
      status: string;
    };
  };
  createdAt: Date;
  hotels: HotelBookingMapper[];
  cars: CarBookingMapper[];
  flights: FlightBookingMapper[];
  visas: VisaBookingMapper[];

  static fromEntities(
    bundle: Booking,
    subEntities: {
      hotels: HotelBooking[];
      cars: CarBooking[];
      flights: FlightBooking[];
      visas: VisaBooking[];
    },
  ): BundleMapper {
    return {
      id: bundle.id,
      user: {
        accountId: bundle.user.accountId,
        name: bundle.user.name,
        account: {
          email: bundle.user.account.email,
          phone: bundle.user.account.phone,
          status: bundle.user.account.status,
        },
      },
      createdAt: bundle.createdAt,
      hotels: subEntities.hotels.map(HotelBookingMapper.fromEntities),
      cars: subEntities.cars.map(CarBookingMapper.fromEntities),
      flights: subEntities.flights.map(FlightBookingMapper.fromEntities),
      visas: subEntities.visas.map(VisaBookingMapper.fromEntities),
    };
  }
}
