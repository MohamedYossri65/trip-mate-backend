import { OfficeProfile } from "../entity/office.entity";


export class OfficeDetailsMapper {
    officeId: bigint;
    officeName: string;
    averageRating: number;
    completedBookings: number;
    createdAt: Date;
    logoUrl?: string;

    static fromEntities(officeDetails: OfficeProfile ,averageRating: number ,completedBookings: number): OfficeDetailsMapper {
        return {
            officeId: officeDetails.accountId,
            officeName: officeDetails.officeName,
            averageRating: averageRating,
            completedBookings: completedBookings,
            createdAt: officeDetails.account.createdAt,
            logoUrl: officeDetails.logoUrl,
        };
    }
}