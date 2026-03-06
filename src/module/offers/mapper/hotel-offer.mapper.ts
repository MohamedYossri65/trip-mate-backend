import { HotelOfferDetails, RoomDetail } from '../entity/hotel-offer-details';
import { Offer } from '../entity/offer.entity';
import { CreateHotelOfferDto } from '../dto/create-hotel-offer.dto';
import { OfficeDetailsMapper } from 'src/module/office/mapper/office-details.mapper';

export class HotelOfferMapper {
    offerId: bigint;
    offer: {
        price: number;
        status: string;
        offerDuration: Date;
    };
    arrivalCountry: string;
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
    attachments?: string[];

    officeDetails?: OfficeDetailsMapper | undefined;
    canOfficeEditOffer: boolean;

    static fromEntities(hotelOfferDetails: HotelOfferDetails, canOfficeEditOffer: boolean, officeDetails: OfficeDetailsMapper | undefined): HotelOfferMapper {
        return {
            offerId: hotelOfferDetails.offer.id,
            offer: {
                price: hotelOfferDetails.offer.price,
                status: hotelOfferDetails.offer.status,
                offerDuration: hotelOfferDetails.offer.offerDuration,
            },
            arrivalCountry: hotelOfferDetails.offer.arrivalCountry,
            destinationCity: hotelOfferDetails.destinationCity,
            isTherePreferredHotel: hotelOfferDetails.isTherePreferredHotel,
            hotelName: hotelOfferDetails.hotelName,
            starRating: hotelOfferDetails.starRating,
            checkIn: hotelOfferDetails.checkIn,
            checkOut: hotelOfferDetails.checkOut,
            numGuests: hotelOfferDetails.numGuests,
            numChildren: hotelOfferDetails.numChildren,
            roomDetails: hotelOfferDetails.roomDetails,
            notes: hotelOfferDetails.notes || '',
            attachments: hotelOfferDetails.offer.attachments || [],
            officeDetails: officeDetails || undefined,
            canOfficeEditOffer: canOfficeEditOffer
        };
    }

    static fromDto(dto: CreateHotelOfferDto, offer: Offer): Partial<HotelOfferDetails> {
        return {
            offerId: offer.id,
            destinationCity: dto.destinationCity,
            isTherePreferredHotel: dto.isTherePreferredHotel,
            hotelName: dto.hotelName,
            starRating: dto.starRating,
            checkIn: dto.checkIn,
            checkOut: dto.checkOut,
            numGuests: dto.numGuests,
            numChildren: dto.numChildren,
            roomDetails: dto.roomDetails,
            notes: dto.notes || '',
        };
    }
}
