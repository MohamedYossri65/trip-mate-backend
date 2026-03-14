import { BundleBase } from "../entity/bundle-base.entity";


export class findAllBundlesMapper {

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
    createdAt: Date;
    destinationCountry?: string;
    numberOfGuests: number;
    static toBaseBunddleResponse(baseBundle: BundleBase, arrivalCountry?: string): any {
        return {
            id: baseBundle.bookingId,
            user: {
                accountId: baseBundle.booking.user.accountId,
                name: baseBundle.booking.user.name,
                account: {
                    email: baseBundle.booking.user.account.email,
                    phone: baseBundle.booking.user.account.phone,
                    status: baseBundle.booking.user.account.status,
                }
            },
            createdAt: baseBundle.createdAt,
            destinationCountry: arrivalCountry,
            numberOfGuests: (baseBundle.companionsAdults || 0) + (baseBundle.companionsChildren || 0) + 1,
        }
    }
}