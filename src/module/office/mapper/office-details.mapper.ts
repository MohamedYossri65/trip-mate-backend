import { OfficeProfile } from "../entity/office.entity";


export class OfficeDetailsMapper {
    officeId: bigint;
    officeName: string;
    averageRating: number;
    completedBookings: number;
    location: string;
    description?: string;
    createdAt: Date;
    logoUrl?: string;
    bookingCompletionRate: number;

    static fromEntities(
        officeDetails: OfficeProfile ,
        averageRating: number ,
        completedBookings: number,
        bookingCompletionRate: number,
    ): OfficeDetailsMapper {
        return {
            officeId: officeDetails.accountId,
            officeName: officeDetails.officeName,
            location: officeDetails.location,
            description: officeDetails.description,
            averageRating: averageRating,
            completedBookings: completedBookings,
            createdAt: officeDetails.account.createdAt,
            logoUrl: officeDetails.logoUrl,
            bookingCompletionRate: bookingCompletionRate,
        };
    }
}