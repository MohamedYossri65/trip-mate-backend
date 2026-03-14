import { CreateBundleCarBookingDto } from "../dto/create-bundle-booking.dto";
import { CarBundle } from "../entity/bundle-car.entity";


export class CarBundleBookingMapper {
    bundleBaseId: bigint;
    deliveryLocation: string;
    deliveryDate: Date;
    returnDate: Date;
    carType: string;
    transmissionType: string;
    carBrand: string;
    carModel: string;
    hasDrivingLicense: boolean;
    driverAge: number;
    drivingExperienceYears: number | null;
    requiresPrivateDriver: boolean;
    requiresChildSeat: boolean;
    requiresFullInsurance: boolean;
    notes: string;

    static toEntity(dto: CreateBundleCarBookingDto): CarBundle {
        const entity = new CarBundle();
        entity.deliveryLocation = dto.deliveryLocation;
        entity.deliveryDate = new Date(dto.deliveryDate);
        entity.returnDate = new Date(dto.returnDate);
        entity.carType = dto.carType;
        entity.transmissionType = dto.transmissionType;
        entity.carBrand = dto.carBrand;
        entity.carModel = dto.carModel;
        entity.hasDrivingLicense = dto.hasDrivingLicense;
        entity.driverAge = dto.driverAge;
        entity.drivingExperienceYears = dto.drivingExperienceYears ?? null;
        entity.requiresPrivateDriver = dto.requiresPrivateDriver;
        entity.requiresChildSeat = dto.requiresChildSeat;
        entity.requiresFullInsurance = dto.requiresFullInsurance;
        entity.notes = dto.notes;

        return entity;
    }

    static toDto(entity: CarBundle): CarBundleBookingMapper {
        return {
            bundleBaseId: entity.bundleBaseId,
            deliveryLocation: entity.deliveryLocation,
            deliveryDate: entity.deliveryDate,
            returnDate: entity.returnDate,
            carType: entity.carType,
            transmissionType: entity.transmissionType,
            carBrand: entity.carBrand || '',
            carModel: entity.carModel || '',
            hasDrivingLicense: entity.hasDrivingLicense,
            driverAge: entity.driverAge,
            drivingExperienceYears: entity.drivingExperienceYears,
            requiresPrivateDriver: entity.requiresPrivateDriver,
            requiresChildSeat: entity.requiresChildSeat,
            requiresFullInsurance: entity.requiresFullInsurance,
            notes: entity.notes || '',
        };
    }

}