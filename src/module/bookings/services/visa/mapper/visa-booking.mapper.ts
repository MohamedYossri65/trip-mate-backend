import { VisaBooking } from '../entity/visa-booking.entity';
import { CreateVisaBookingDto } from '../dto/create-visa.dto';
import { Booking } from '../../../domain/entity/booking.entity';

export class VisaBookingMapper {
    bookingId: bigint;
    booking: {
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
        type: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
    }
    fingerPrintLocation: string;
    arrivalCountry: string;
    visaType: string;
    departureDate: Date;
    companionsAdults: number;
    companionsChildren: number;

    canOfficeAddOffers?: boolean;

    static fromEntities(visaBooking: VisaBooking): VisaBookingMapper {
        return {
            bookingId: visaBooking.bookingId,
            booking: {
                id: visaBooking.booking.id,
                user: {
                    accountId: visaBooking.booking.user.accountId,
                    name: visaBooking.booking.user.name,
                    account: {
                        email: visaBooking.booking.user.account.email,
                        phone: visaBooking.booking.user.account.phone,
                        status: visaBooking.booking.user.account.status,
                    },
                },
                type: visaBooking.booking.type,
                status: visaBooking.booking.status,
                createdAt: visaBooking.booking.createdAt,
                updatedAt: visaBooking.booking.updatedAt,
            },
            fingerPrintLocation: visaBooking.fingerPrintLocation,
            arrivalCountry: visaBooking.arrivalCountry,
            visaType: visaBooking.visaType,
            departureDate: visaBooking.departureDate,
            companionsAdults: visaBooking.companionsAdults,
            companionsChildren: visaBooking.companionsChildren,
        };
    }

    static fromDto(dto: CreateVisaBookingDto, booking: Booking): Partial<VisaBooking> {
        return {
            bookingId: booking.id,
            fingerPrintLocation: dto.fingerPrintLocation,
            arrivalCountry: dto.arrivalCountry,
            visaType: dto.visaType,
            departureDate: dto.departureDate,
            companionsAdults: dto.companionsAdults,
            companionsChildren: dto.companionsChildren,
        };
    }
}
