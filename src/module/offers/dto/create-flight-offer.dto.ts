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

export class CreateFlightOfferDto {
    @IsNumber()
    @Type(() => Number)
    bookingId: number;

    @IsNumber()
    price: number;

    @IsString()
    @IsNotEmpty()
    arrivalCountry: string;

    // ================== Departure ==================

    @IsString()
    @IsNotEmpty()
    departureCountry: string;

    @IsString()
    @IsNotEmpty()
    departureCity: string;

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
    hasPassport: boolean;

    @IsDate()
    @Type(() => Date)
    @IsOptional()
    endingDate: Date;

    @ValidateIf(o => o.hasVisa === false)
    @IsBoolean()
    isYouTravelToThisCountryBefore: boolean;

    @ValidateIf(o => o.hasVisa === false)
    @IsBoolean()
    isYourVisaRefusedBefore: boolean;

    @IsDate()
    @Type(() => Date)
    offerDuration: Date;

    @IsOptional()
    @IsString()
    notes?: string;

    @IsOptional()
    @IsString({ each: true })
    attachments?: string[];
}
