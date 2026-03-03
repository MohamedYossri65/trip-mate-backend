import { Booking } from '../../entity/booking.entity';
import { CreateFlightBookingDto } from '../dto/create-flight-booking.dto';
import { FlightBooking } from '../entity/flight.-booking.entity';

export class FlightBookingMapper {
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
    }
    departureCountry: string;
    departureCity: string;
    arrivalCountry: string;
    arrivalCity: string;
    isRoundTrip: boolean;
    departureDate: Date;
    returnDate?: Date;
    hasVisa: boolean;
    hasCompanions: boolean;
    numberOfCompanions?: number;
    fullName: string;
    dateOfBirth: Date;
    nationalIdNumber: string;
    nationality: string;
    hasPassport: boolean;
    isYouTravelToThisCountryBefore: boolean;
    isYourVisaRefusedBefore: boolean;

    static fromEntities(flightBooking: FlightBooking): FlightBookingMapper {
        return {
            bookingId: flightBooking.bookingId,
            booking: {
                id: flightBooking.booking.id,
                user: {
                    id: flightBooking.booking.user.id,
                    name: flightBooking.booking.user.name,
                    account: {
                        accountId: flightBooking.booking.user.account.id,
                        email: flightBooking.booking.user.account.email,
                        phone: flightBooking.booking.user.account.phone,
                        status: flightBooking.booking.user.account.status,
                    },
                },
                type: flightBooking.booking.type,
                status: flightBooking.booking.status,
                createdAt: flightBooking.booking.createdAt,
                updatedAt: flightBooking.booking.updatedAt,
            },
            departureCountry: flightBooking.departureCountry,
            departureCity: flightBooking.departureCity,
            arrivalCountry: flightBooking.arrivalCountry,
            arrivalCity: flightBooking.arrivalCity,
            isRoundTrip: flightBooking.isRoundTrip,
            departureDate: flightBooking.departureDate,
            returnDate: flightBooking.returnDate,
            hasVisa: flightBooking.hasVisa,
            hasCompanions: flightBooking.hasCompanions,
            numberOfCompanions: flightBooking.numberOfCompanions,
            fullName: flightBooking.fullName,
            dateOfBirth: flightBooking.dateOfBirth,
            nationalIdNumber: flightBooking.nationalIdNumber,
            nationality: flightBooking.nationality,
            hasPassport: flightBooking.hasPassport,
            isYouTravelToThisCountryBefore: flightBooking.isYouTravelToThisCountryBefore,
            isYourVisaRefusedBefore: flightBooking.isYourVisaRefusedBefore,
        };
    }

    static fromDto(dto: CreateFlightBookingDto, booking: Booking): Partial<FlightBooking> {
        return {
            bookingId: booking.id,
            departureCountry: dto.departureCountry,
            departureCity: dto.departureCity,
            arrivalCountry: dto.arrivalCountry,
            arrivalCity: dto.arrivalCity,
            isRoundTrip: dto.isRoundTrip,
            departureDate: dto.departureDate,
            returnDate: dto.returnDate,
            hasVisa: dto.hasVisa,
            hasCompanions: dto.hasCompanions,
            numberOfCompanions: dto.numberOfCompanions,
            fullName: dto.fullName,
            dateOfBirth: dto.dateOfBirth,
            nationalIdNumber: dto.nationalIdNumber,
            nationality: dto.nationality,
            hasPassport: dto.hasPassport,
            isYouTravelToThisCountryBefore: dto.isYouTravelToThisCountryBefore,
            isYourVisaRefusedBefore: dto.isYourVisaRefusedBefore,
        };
    }
}
