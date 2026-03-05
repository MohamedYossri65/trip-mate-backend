import { CarOfferDetails } from "../entity/car-offer-details";
import { Offer } from "../entity/offer.entity";
import { CreateCarOfferDto } from "../dto/create-car-offer.dto";


export class CarOfferMapper {
    offerId: bigint;
    offer: {
        price: number;
        status: string;
        offerDuration: Date;
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
    static fromEntities(carofferDetails: CarOfferDetails): CarOfferMapper {
        return {
            offerId: carofferDetails.offer.id,
            offer: {
                price: carofferDetails.offer.price,
                status: carofferDetails.offer.status,
                offerDuration: carofferDetails.offer.offerDuration,
            },
            arrivalCountry: carofferDetails.offer.arrivalCountry,
            arrivalCity: carofferDetails.arrivalCity,
            deliveryLocation: carofferDetails.deliveryLocation,
            deliveryDate: carofferDetails.deliveryDate,
            returnDate: carofferDetails.returnDate,
            carType: carofferDetails.carType,
            transmissionType: carofferDetails.transmissionType,
            carBrand: carofferDetails.carBrand,
            carModel: carofferDetails.carModel,
            hasDrivingLicense: carofferDetails.hasDrivingLicense,
            driverAge: carofferDetails.driverAge,
            drivingExperienceYears: carofferDetails.drivingExperienceYears,
            requiresPrivateDriver: carofferDetails.requiresPrivateDriver,
            requiresChildSeat: carofferDetails.requiresChildSeat,
            requiresFullInsurance: carofferDetails.requiresFullInsurance,
            notes: carofferDetails.notes || '',
        };
    }

    static fromDto(dto: CreateCarOfferDto, offer: Offer): Partial<CarOfferDetails> {
        return {
            offerId: offer.id,
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