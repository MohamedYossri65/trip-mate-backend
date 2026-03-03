import {
    IsBoolean,
    IsDate,
    IsInt,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    Max,
    Min,
    ValidateNested,
    IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCarBookingDto {
    @IsString()
    @IsNotEmpty()
    arrivalCountry: string;

    @IsString()
    @IsNotEmpty()
    arrivalCity: string;

    @IsString()
    @IsNotEmpty()
    deliveryLocation: string;

    @IsDate()
    @Type(() => Date)
    deliveryDate: Date;

    @IsDate()
    @Type(() => Date)
    returnDate: Date;

    @IsString()
    @IsNotEmpty()
    carType: string;

    @IsString()
    @IsNotEmpty()
    transmissionType: string;

    @IsString()
    carBrand?: string;

    @IsString()
    carModel?: string;

    @IsBoolean()
    hasDrivingLicense: boolean;

    @IsNumber()
    @Min(18)
    @Max(120)
    driverAge: number;

    @IsOptional()
    drivingExperienceYears: number | null;

    @IsBoolean()
    requiresPrivateDriver: boolean;

    @IsBoolean()
    requiresChildSeat: boolean;

    @IsBoolean()
    requiresFullInsurance: boolean;

    @IsOptional()
    @IsString()
    notes?: string;
}
