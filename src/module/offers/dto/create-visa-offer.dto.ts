import { Type } from 'class-transformer';
import {
    IsDate,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
} from 'class-validator';

export class CreateVisaOfferDto {
    @IsNumber()
    @Type(() => Number)
    bookingId: number;

    @IsNumber()
    price: number;

    @IsString()
    @IsNotEmpty()
    arrivalCountry: string;

    @IsString()
    @IsNotEmpty()
    fingerPrintLocation: string;

    @IsString()
    @IsNotEmpty()
    visaType: string;

    @IsDate()
    @Type(() => Date)
    departureDate: Date;

    @IsNumber()
    companionsAdults: number;

    @IsNumber()
    companionsChildren: number;

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
