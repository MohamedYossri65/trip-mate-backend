import { Type } from 'class-transformer';
import {
    IsBoolean,
    IsDate,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    Max,
    Min,
} from 'class-validator';

export class UpdateCarOfferDto {
    @IsOptional()
    @IsNumber()
    price?: number;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    arrivalCountry?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    arrivalCity?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    deliveryLocation?: string;

    @IsOptional()
    @IsDate()
    @Type(() => Date)
    deliveryDate?: Date;

    @IsOptional()
    @IsDate()
    @Type(() => Date)
    returnDate?: Date;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    carType?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    transmissionType?: string;

    @IsOptional()
    @IsString()
    carBrand?: string;

    @IsOptional()
    @IsString()
    carModel?: string;

    @IsOptional()
    @IsBoolean()
    hasDrivingLicense?: boolean;

    @IsOptional()
    @IsNumber()
    @Min(18)
    @Max(120)
    driverAge?: number;

    @IsOptional()
    drivingExperienceYears?: number | null;

    @IsOptional()
    @IsBoolean()
    requiresPrivateDriver?: boolean;

    @IsOptional()
    @IsBoolean()
    requiresChildSeat?: boolean;

    @IsOptional()
    @IsBoolean()
    requiresFullInsurance?: boolean;

    @IsOptional()
    @IsDate()
    @Type(() => Date)
    offerDuration?: Date;

    @IsOptional()
    @IsString()
    notes?: string;

    @IsOptional()
    @IsString({ each: true })
    attachments?: string[];
}
