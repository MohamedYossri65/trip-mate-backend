import { Type } from 'class-transformer';
import {
    IsDate,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
} from 'class-validator';

export class CreateBundleOfferDto {
    @IsNumber()
    @Type(() => Number)
    bookingId: number;

    @IsNumber()
    price: number;

    @IsString()
    @IsNotEmpty()
    arrivalCountry: string;

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
