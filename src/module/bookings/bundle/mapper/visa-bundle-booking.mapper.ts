import { CreateBundleVisaBookingDto } from '../dto/create-bundle-booking.dto';
import { VisaBundle } from '../entity/bundle-visa.entity';

export class VisaBundleBookingMapper {

    bundleBaseId: bigint;
    depretureCountry?: string;
    arrivalCountry: string;
    visaType: string;
    departureDate: Date;
    returnDate: Date | null;

    static toEntity(dto: CreateBundleVisaBookingDto): VisaBundle {
        const entity = new VisaBundle();

        entity.depretureCountry = dto.depretureCountry || '';
        entity.arrivalCountry = dto.arrivalCountry;
        entity.visaType = dto.visaType;
        entity.departureDate = new Date(dto.departureDate);
        entity.returnDate = dto.returnDate ? new Date(dto.returnDate) : null;

        return entity;
    }

    static toDto(entity: VisaBundle): VisaBundleBookingMapper {
        return {
            bundleBaseId: entity.bundleBaseId,
            depretureCountry: entity.depretureCountry || '',
            arrivalCountry: entity.arrivalCountry,
            visaType: entity.visaType,
            departureDate: entity.departureDate,
            returnDate: entity.returnDate 
        };
    }

}