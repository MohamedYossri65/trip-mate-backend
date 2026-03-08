import { FlightOfferDetails } from '../entity/flight-offer-details';
import { Offer } from '../entity/offer.entity';
import { CreateFlightOfferDto } from '../dto/create-flight-offer.dto';
import { OfficeDetailsMapper } from 'src/module/office/mapper/office-details.mapper';

export class FlightOfferMapper {
    offerId: bigint;
    offer: {
        price: number;
        status: string;
        offerDuration: Date;
    };
    arrivalCountry: string;
    departureCountry: string;
    departureCity: string;
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
    endingDate: Date;
    isYouTravelToThisCountryBefore: boolean;
    isYourVisaRefusedBefore: boolean;
    notes?: string;
    attachments?: string[];

    officeDetails: OfficeDetailsMapper | undefined;
    canOfficeEditOffer: boolean;

    static fromEntities(flightOfferDetails: FlightOfferDetails, canOfficeEditOffer: boolean, officeDetails: OfficeDetailsMapper | undefined): FlightOfferMapper {
        return {
            offerId: flightOfferDetails.offer.id,
            offer: {
                price: flightOfferDetails.offer.price,
                status: flightOfferDetails.offer.status,
                offerDuration: flightOfferDetails.offer.offerDuration,
            },
            arrivalCountry: flightOfferDetails.offer.arrivalCountry,
            departureCountry: flightOfferDetails.departureCountry,
            departureCity: flightOfferDetails.departureCity,
            arrivalCity: flightOfferDetails.arrivalCity,
            isRoundTrip: flightOfferDetails.isRoundTrip,
            departureDate: flightOfferDetails.departureDate,
            returnDate: flightOfferDetails.returnDate,
            hasVisa: flightOfferDetails.hasVisa,
            hasCompanions: flightOfferDetails.hasCompanions,
            numberOfCompanions: flightOfferDetails.numberOfCompanions,
            fullName: flightOfferDetails.fullName,
            dateOfBirth: flightOfferDetails.dateOfBirth,
            nationalIdNumber: flightOfferDetails.nationalIdNumber,
            nationality: flightOfferDetails.nationality,
            hasPassport: flightOfferDetails.hasPassport,
            endingDate: flightOfferDetails.endingDate,
            isYouTravelToThisCountryBefore: flightOfferDetails.isYouTravelToThisCountryBefore,
            isYourVisaRefusedBefore: flightOfferDetails.isYourVisaRefusedBefore,
            notes: flightOfferDetails.notes || '',
            attachments: flightOfferDetails.offer.attachments || [],
            officeDetails: officeDetails || undefined,
            canOfficeEditOffer: canOfficeEditOffer
        };
    }

    static fromDto(dto: CreateFlightOfferDto, offer: Offer): Partial<FlightOfferDetails> {
        return {
            offerId: offer.id,
            departureCountry: dto.departureCountry,
            departureCity: dto.departureCity,
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
            notes: dto.notes || '',
            endingDate: dto.endingDate,
        };
    }
}
