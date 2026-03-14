import { BundleOfferDetails } from '../entity/bundle-offer-details';
import { Offer } from '../entity/offer.entity';
import { CreateBundleOfferDto } from '../dto/create-bundle-offer.dto';
import { CreateAllBookingsDto } from 'src/module/bookings/domain/dto/create-all-bookings.dto';
import { OfficeDetailsMapper } from 'src/module/office/mapper/office-details.mapper';

export class BundleOfferMapper {
    offerId: bigint;
    offer: {
        price: number;
        status: string;
        offerDuration: Date;
    };
    arrivalCountry: string;
    bookingRequestDate: Date;
    bundelDetails?: CreateAllBookingsDto;
    notes?: string;
    attachments?: string[];
    officeDetails?: OfficeDetailsMapper | undefined;
    canOfficeEditOffer: boolean;

    static fromEntities(
        bundleOfferDetails: BundleOfferDetails,
        canOfficeEditOffer: boolean,
        officeDetails: OfficeDetailsMapper | undefined,
    ): BundleOfferMapper {
        return {
            offerId: bundleOfferDetails.offer.id,
            offer: {
                price: bundleOfferDetails.offer.price,
                status: bundleOfferDetails.offer.status,
                offerDuration: bundleOfferDetails.offer.offerDuration,
            },
            arrivalCountry: bundleOfferDetails.offer.arrivalCountry,
            bookingRequestDate: bundleOfferDetails.offer.booking.createdAt,
            bundelDetails: bundleOfferDetails.bundelDetails as CreateAllBookingsDto,
            notes: bundleOfferDetails.notes || '',
            attachments: bundleOfferDetails.offer.attachments || [],
            officeDetails: officeDetails || undefined,
            canOfficeEditOffer,
        };
    }

    static fromDto(dto: CreateBundleOfferDto, offer: Offer): Partial<BundleOfferDetails> {
        return {
            offerId: offer.id,
            bundelDetails: dto.bundelDetails,
            notes: dto.notes || '',
        };
    }
}
