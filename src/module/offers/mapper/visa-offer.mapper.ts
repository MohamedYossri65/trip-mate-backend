import { VisaOfferDetails } from '../entity/visa-offer-details';
import { Offer } from '../entity/offer.entity';
import { CreateVisaOfferDto } from '../dto/create-visa-offer.dto';
import { OfficeDetailsMapper } from 'src/module/office/mapper/office-details.mapper';

export class VisaOfferMapper {
    offerId: bigint;
    offer: {
        price: number;
        status: string;
        offerDuration: Date;
    };
    arrivalCountry: string;
    arrivalCity: string;
    fingerPrintLocation: string;
    visaType: string;
    departureDate: Date;
    companionsAdults: number;
    companionsChildren: number;
    notes?: string;
    attachments?: string[];

    officeDetails: OfficeDetailsMapper | undefined;
    canOfficeEditOffer: boolean;

    static fromEntities(visaOfferDetails: VisaOfferDetails, canOfficeEditOffer: boolean, officeDetails: OfficeDetailsMapper | undefined): VisaOfferMapper {
        return {
            offerId: visaOfferDetails.offer.id,
            offer: {
                price: visaOfferDetails.offer.price,
                status: visaOfferDetails.offer.status,
                offerDuration: visaOfferDetails.offer.offerDuration,
            },
            arrivalCountry: visaOfferDetails.offer.arrivalCountry,
            arrivalCity: visaOfferDetails.arrivalCity,
            fingerPrintLocation: visaOfferDetails.fingerPrintLocation,
            visaType: visaOfferDetails.visaType,
            departureDate: visaOfferDetails.departureDate,
            companionsAdults: visaOfferDetails.companionsAdults,
            companionsChildren: visaOfferDetails.companionsChildren,
            notes: visaOfferDetails.notes || '',
            attachments: visaOfferDetails.offer.attachments || [],
            officeDetails : officeDetails || undefined ,
            canOfficeEditOffer
        };
    }

    static fromDto(dto: CreateVisaOfferDto, offer: Offer): Partial<VisaOfferDetails> {
        return {
            offerId: offer.id,
            arrivalCity: dto.arrivalCity,
            fingerPrintLocation: dto.fingerPrintLocation,
            visaType: dto.visaType,
            departureDate: dto.departureDate,
            companionsAdults: dto.companionsAdults,
            companionsChildren: dto.companionsChildren,
            notes: dto.notes || '',
        };
    }
}
