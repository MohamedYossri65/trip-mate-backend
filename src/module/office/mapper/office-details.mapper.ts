import { OfficeEmployee } from "../entity/employee.entity";
import { OfficeProfile } from "../entity/office.entity";


export class OfficeDetailsMapper {
    officeId: bigint;
    commerceNumber: string;
    officeName: string;
    averageRating: number;
    status: string;
    completedBookings: number;
    location: string;
    description?: string;
    createdAt: Date;
    logoUrl?: string;
    bookingCompletionRate: number;

    employees?: {
        id: bigint;
        name: string;
        phone: string;
        roleInOffice: string;
        isActive: boolean;
        status?: string;
    }[];
    ;

    static fromEntities(
        officeDetails: OfficeProfile ,
        employees: OfficeEmployee[] ,
        averageRating: number ,
        completedBookings: number,
        bookingCompletionRate: number,
    ): OfficeDetailsMapper {
        return {
            officeId: officeDetails.accountId,
            commerceNumber: officeDetails.commerceNumber,
            officeName: officeDetails.officeName,
            location: officeDetails.location,
            description: officeDetails.description,
            averageRating: averageRating,
            completedBookings: completedBookings,
            createdAt: officeDetails.account.createdAt,
            logoUrl: officeDetails.logoUrl,
            status: officeDetails.account.status,
            bookingCompletionRate: bookingCompletionRate,
            employees : employees.map(emp => ({
                id: emp.id,
                name: emp.name,
                phone: emp.phone,
                roleInOffice: emp.roleInOffice,
                isActive: emp.isActive,
                status: emp.account?.status,
            })),
        };
    }
}