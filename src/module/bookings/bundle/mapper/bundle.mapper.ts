import { Bundle } from '../../entity/bundle.entity';
import { HotelBooking } from '../../hotel/entity/hotel-booking.entity';
import { CarBooking } from '../../car/entity/car-booking.entity';
import { FlightBooking } from '../../flight/entity/flight.-booking.entity';
import { VisaBooking } from '../../visa/entity/visa-booking.entity';
import { HotelBookingMapper } from '../../hotel/mapper/hotel-booking.mapper';
import { CarBookingMapper } from '../../car/mapper/car-booking.mapper';
import { FlightBookingMapper } from '../../flight/mapper/flight-booking.mapper';
import { VisaBookingMapper } from '../../visa/mapper/visa-booking.mapper';

export class BundleMapper {
  bundleId: bigint;
  user: {
    id: bigint;
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
    bundle: Bundle,
    subEntities: {
      hotels: HotelBooking[];
      cars: CarBooking[];
      flights: FlightBooking[];
      visas: VisaBooking[];
    },
  ): BundleMapper {
    return {
      bundleId: bundle.id,
      user: {
        id: bundle.user.id,
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
