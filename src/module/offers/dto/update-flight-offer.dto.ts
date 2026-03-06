import { Type } from 'class-transformer';
import {
    IsBoolean,
    IsDate,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    Min,
} from 'class-validator';

export class UpdateFlightOfferDto {
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
    departureCountry?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    departureCity?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    arrivalCity?: string;

    @IsOptional()
    @IsBoolean()
    isRoundTrip?: boolean;

    @IsOptional()
    @IsDate()
    @Type(() => Date)
    departureDate?: Date;

    @IsOptional()
    @IsDate()
    @Type(() => Date)
    returnDate?: Date;

    @IsOptional()
    @IsBoolean()
    hasVisa?: boolean;

    @IsOptional()
    @IsBoolean()
    hasCompanions?: boolean;

    @IsOptional()
    @IsNumber()
    @Min(1)
    numberOfCompanions?: number;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    fullName?: string;

    @IsOptional()
    @IsDate()
    @Type(() => Date)
    dateOfBirth?: Date;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    nationalIdNumber?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    nationality?: string;

    @IsOptional()
    @IsBoolean()
    hasPassport?: boolean;

    @IsOptional()
    @IsBoolean()
    isYouTravelToThisCountryBefore?: boolean;

    @IsOptional()
    @IsBoolean()
    isYourVisaRefusedBefore?: boolean;

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
