import { BundleMapper } from "../../bundle/mapper/bundle.mapper";
import { CarBookingMapper } from "../../services/car/mapper/car-booking.mapper";
import { FlightBookingMapper } from "../../services/flight/mapper/flight-booking.mapper";
import { HotelBookingMapper } from "../../services/hotel/mapper/hotel-booking.mapper";
import { VisaBookingMapper } from "../../services/visa/mapper/visa-booking.mapper";
import { BookingType } from "../enum/booking-type.enum";


export class FindHomePageMapper {

    static fromEntities(
        bundles: BundleMapper[],
        hotels: HotelBookingMapper[],
        cars: CarBookingMapper[],
        visas: VisaBookingMapper[],
        flights: FlightBookingMapper[],
    ) {
        return {
            bundles: bundles.map((bundle) => ({
                type: BookingType.BUNDLE,
                id: bundle.id,
                name: bundle.user.name,
                createdAt: bundle.createdAt,
            })),
            hotels: hotels.map((hotel) => ({
                bookingId: hotel.bookingId,
                type: BookingType.HOTEL,
                name: hotel.booking.user.name,
                createdAt: hotel.booking.createdAt,
                destinationCountry: hotel.destinationCountry,
                rate: hotel.starRating,
                numberOfGuests: hotel.numGuests + hotel.numChildren + 1,
            })),
            cars: cars.map((car) => ({
                bookingId: car.bookingId,
                type: BookingType.CAR,
                name: car.booking.user.name,
                createdAt: car.booking.createdAt,
                destinationCountry: car.arrivalCountry,
            })),
            visas: visas.map((visa) => ({
                bookingId: visa.bookingId,
                type: BookingType.VISA,
                name: visa.booking.user.name,
                createdAt: visa.booking.createdAt,
                destinationCountry: visa.arrivalCountry,
                numberOfPassengers: visa.companionsAdults + visa.companionsChildren + 1,
                visaType: visa.visaType,
            })),
            flights: flights.map((flight) => ({
                bookingId: flight.bookingId,
                type: BookingType.FLIGHT,
                name: flight.booking.user.name,
                createdAt: flight.booking.createdAt,
                destinationCountry: flight.arrivalCountry,
                destinationCity: flight.arrivalCity,
                numberOfPassengers: (flight?.numberOfCompanions ?? 0) + 1,
            })),
        };
    }
}