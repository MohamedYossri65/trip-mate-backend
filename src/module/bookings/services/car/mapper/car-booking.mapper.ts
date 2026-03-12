import { CarBooking } from '../entity/car-booking.entity';
import { CreateCarBookingDto } from '../dto/create-car-booking.dto';
import { Booking } from '../../../domain/entity/booking.entity';

export class CarBookingMapper {
    bookingId: bigint;
    booking: {
        id: bigint;
        user: {
            accountId: bigint;
            name: string;
            account: {
                email: string;
                phone: string; status: string;
            };
        };
        type: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
    }
    arrivalCountry: string;
    arrivalCity: string
    deliveryLocation: string;
    deliveryDate: Date;
    returnDate: Date;
    carType: string;
    transmissionType: string;
    carBrand?: string;
    carModel?: string;
    hasDrivingLicense: boolean;
    driverAge: number;
    drivingExperienceYears: number | null;
    requiresPrivateDriver: boolean;
    requiresChildSeat: boolean;
    requiresFullInsurance: boolean;
    notes?: string;

    canChatbeEnabled?: boolean;
    canOfficeAddOffers?: boolean;
    canUserReviewBooking?: boolean;

    
    static fromEntities(carBooking: CarBooking): CarBookingMapper {
        return {
            bookingId: carBooking.bookingId,
            booking: {
                id: carBooking.booking.id,
                user: {
                    accountId: carBooking.booking.user.accountId,
                    name: carBooking.booking.user.name,
                    account: {
                        email: carBooking.booking.user.account.email,
                        phone: carBooking.booking.user.account.phone,
                        status: carBooking.booking.user.account.status,
                    },
                },
                type: carBooking.booking.type,
                status: carBooking.booking.status,
                createdAt: carBooking.booking.createdAt,
                updatedAt: carBooking.booking.updatedAt,
            },
            arrivalCountry: carBooking.arrivalCountry,
            arrivalCity: carBooking.arrivalCity,
            deliveryLocation: carBooking.deliveryLocation,
            deliveryDate: carBooking.deliveryDate,
            returnDate: carBooking.returnDate,
            carType: carBooking.carType,
            transmissionType: carBooking.transmissionType,
            carBrand: carBooking.carBrand,
            carModel: carBooking.carModel,
            hasDrivingLicense: carBooking.hasDrivingLicense,
            driverAge: carBooking.driverAge,
            drivingExperienceYears: carBooking.drivingExperienceYears,
            requiresPrivateDriver: carBooking.requiresPrivateDriver,
            requiresChildSeat: carBooking.requiresChildSeat,
            requiresFullInsurance: carBooking.requiresFullInsurance,
            notes: carBooking.notes || '',
        };
    }

    static fromDto(dto: CreateCarBookingDto, booking: Booking): Partial<CarBooking> {
        return {
            bookingId: booking.id,
            arrivalCountry: dto.arrivalCountry,
            arrivalCity: dto.arrivalCity,
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
        };
    }
}
