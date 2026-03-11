import { Offer } from "../entity/offer.entity";


export class OfferMapper {
    offerId: bigint;
    price: number;
    currency: string;
    status: string;
    offerDuration: Date;
    createdAt: Date;
    bookingId: bigint;
    user: {
        accountId: bigint;
        name: string;
        account: {
            email: string;
            phone: string; status: string;
        };
    };
    booking: {
        id: bigint;
        type: string;
        destinationCountry: string;
    };
    office: {
        id: bigint;
        officeName: string;
        logo: string;
    } | null;

    canOfficeEditOffer: boolean;

    static fromEntities(offer: Offer, canOfficeEditOffer: boolean): OfferMapper {
        return {
            offerId: offer.id,
            price: offer.price,
            currency: offer.currency,
            status: offer.status,
            offerDuration: offer.offerDuration,
            createdAt: offer.createdAt,
            bookingId: offer.booking.id,
            user: {
                accountId: offer.booking.user.accountId,
                name: offer.booking.user.name,
                account: {
                    email: offer.booking.user.account.email,
                    phone: offer.booking.user.account.phone,
                    status: offer.booking.user.account.status,
                },
            },
            booking: {
                id: offer.booking.id,
                type: offer.booking.type,
                destinationCountry: offer.arrivalCountry,
            },
            office: offer.office ? {
                id: offer.office.accountId,
                officeName: offer.office.officeName,
                logo : offer.office.logoUrl,
            } : null,
            canOfficeEditOffer
        };
    }
}