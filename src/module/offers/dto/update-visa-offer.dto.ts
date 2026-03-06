import { Type } from 'class-transformer';
import {
    IsDate,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
} from 'class-validator';

export class UpdateVisaOfferDto {
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
    fingerPrintLocation?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    visaType?: string;

    @IsOptional()
    @IsDate()
    @Type(() => Date)
    departureDate?: Date;

    @IsOptional()
    @IsNumber()
    companionsAdults?: number;

    @IsOptional()
    @IsNumber()
    companionsChildren?: number;

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
