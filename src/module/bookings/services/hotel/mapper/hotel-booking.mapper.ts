import { HotelBooking, RoomDetail } from '../entity/hotel-booking.entity';
import { CreateHotelBookingDto } from '../dto/create-hotel-booking.dto';
import { Booking } from '../../../domain/entity/booking.entity';

export class HotelBookingMapper {
  bookingId: bigint;
  booking: {
    id: bigint;
    user: {
      id: bigint;
      name: string;
      account: {
        accountId: bigint;
        email: string;
        phone: string;
        status: string;
      };
    };
    type: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  };
  destinationCountry: string;
  destinationCity: string;
  isTherePreferredHotel: boolean;
  hotelName?: string;
  starRating: number;
  checkIn: Date;
  checkOut: Date;
  numGuests: number;
  numChildren: number;
  roomDetails: RoomDetail[];
  notes?: string;

  static fromEntities(
    hotelBooking: HotelBooking,
  ): HotelBookingMapper {
    return {
      bookingId: hotelBooking.bookingId,
      booking: {
        id: hotelBooking.booking.id,
        user: {
          id: hotelBooking.booking.user.id,
          name: hotelBooking.booking.user.name,
          account: {
            accountId: hotelBooking.booking.user.account.id,
            email: hotelBooking.booking.user.account.email,
            phone: hotelBooking.booking.user.account.phone,
            status: hotelBooking.booking.user.account.status,
          },
        },
        type: hotelBooking.booking.type,
        status: hotelBooking.booking.status,
        createdAt: hotelBooking.booking.createdAt,
        updatedAt: hotelBooking.booking.updatedAt,
      },
      destinationCountry: hotelBooking.destinationCountry,
      destinationCity: hotelBooking.destinationCity,
      isTherePreferredHotel: hotelBooking.isTherePreferredHotel,
      hotelName: hotelBooking.isTherePreferredHotel ? hotelBooking.hotelName : '',
      starRating: hotelBooking.starRating,
      checkIn: hotelBooking.checkIn,
      checkOut: hotelBooking.checkOut,
      numGuests: hotelBooking.numGuests,
      numChildren: hotelBooking.numChildren,
      roomDetails: hotelBooking.roomDetails.map(
        (room): RoomDetail => ({
          roomType: room.roomType,
          accommodationType: room.accommodationType,
        }),
      ),
      notes: hotelBooking.notes || '',
    };
  }

  static fromDto(
    dto: CreateHotelBookingDto,
    booking: Booking,
  ): Partial<HotelBooking> {
    return {
      bookingId: booking.id,
      destinationCountry: dto.arrivalCountry,
      destinationCity: dto.arrivalCity,
      isTherePreferredHotel: dto.isTherePreferredHotel,
      hotelName: dto.isTherePreferredHotel ? dto.preferredHotelName : '',
      starRating: dto.hotelStarRating,
      checkIn: dto.checkInDate,
      checkOut: dto.checkOutDate,
      numGuests: dto.numberOfGuests,
      numChildren: dto.numberOfChildren,
      roomDetails: dto.roomDetails.map(
        (room): RoomDetail => ({
          roomType: room.roomType,
          accommodationType: room.accommodationType,
        }),
      ),
      notes: dto.notes || '',
    };
  }
}
