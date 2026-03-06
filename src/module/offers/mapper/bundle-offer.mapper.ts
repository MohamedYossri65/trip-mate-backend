import { BundleOfferDetails } from '../entity/bundle-offer-details';
import { Offer } from '../entity/offer.entity';
import { CreateBundleOfferDto } from '../dto/create-bundle-offer.dto';

export class BundleOfferMapper {
    offerId: bigint;
    offer: {
        price: number;
        status: string;
        offerDuration: Date;
    };
    arrivalCountry: string;
    notes?: string;

    static fromEntities(bundleOfferDetails: BundleOfferDetails): BundleOfferMapper {
        return {
            offerId: bundleOfferDetails.offer.id,
            offer: {
                price: bundleOfferDetails.offer.price,
                status: bundleOfferDetails.offer.status,
                offerDuration: bundleOfferDetails.offer.offerDuration,
            },
            arrivalCountry: bundleOfferDetails.offer.arrivalCountry,
            notes: bundleOfferDetails.notes || '',
        };
    }

    static fromDto(dto: CreateBundleOfferDto, offer: Offer): Partial<BundleOfferDetails> {
        return {
            offerId: offer.id,
            notes: dto.notes || '',
        };
    }
}
