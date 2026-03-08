import { Type } from 'class-transformer';
import {
    IsBoolean,
    IsDate,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    Min,
    ValidateIf,
} from 'class-validator';

export class CreateFlightBookingDto {

    // ================== Departure ==================

    @IsString()
    @IsNotEmpty()
    departureCountry: string;

    @IsString()
    @IsNotEmpty()
    departureCity: string;

    @IsString()
    @IsNotEmpty()
    arrivalCountry: string;

    @IsString()
    @IsNotEmpty()
    arrivalCity: string;

    // ================== Trip Info ==================

    @IsBoolean()
    isRoundTrip: boolean;

    @IsDate()
    @Type(() => Date)
    departureDate: Date;

    @ValidateIf(o => o.isRoundTrip === true)
    @IsDate()
    @Type(() => Date)
    returnDate?: Date;

    // ================== Visa ==================

    @IsBoolean()
    hasVisa: boolean;

    @IsBoolean()
    hasCompanions: boolean;

    @ValidateIf(o => o.hasCompanions === true)
    @IsNumber()
    @Min(1)
    numberOfCompanions?: number;

    // ================== Passenger Info ==================

    @IsString()
    @IsNotEmpty()
    fullName: string;

    @IsDate()
    @Type(() => Date)
    dateOfBirth: Date;

    @IsString()
    @IsNotEmpty()
    nationalIdNumber: string;

    @IsString()
    @IsNotEmpty()
    nationality: string;

    @ValidateIf(o => o.hasVisa === false)
    @IsBoolean()
    hasPassport: boolean = true;

    @ValidateIf(o => o.hasVisa === false)
    @IsDate()
    @Type(() => Date)
    endingDate: Date;

    @ValidateIf(o => o.hasVisa === false)
    @IsBoolean()
    isYouTravelToThisCountryBefore: boolean = false;

    @ValidateIf(o => o.hasVisa === false)
    @IsBoolean()
    isYourVisaRefusedBefore: boolean = false;
}