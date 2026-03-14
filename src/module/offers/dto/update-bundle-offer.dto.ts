import { Type } from 'class-transformer';
import {
    IsDate,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    ValidateNested,
} from 'class-validator';
import { CreateAllBookingsDto } from 'src/module/bookings/domain/dto/create-all-bookings.dto';

export class UpdateBundleOfferDto {
    @IsOptional()
    @IsNumber()
    price?: number;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    arrivalCountry?: string;

    @IsOptional()
    @IsDate()
    @Type(() => Date)
    offerDuration?: Date;

    @IsOptional()
    @ValidateNested()
    @Type(() => CreateAllBookingsDto)
    bundelDetails?: CreateAllBookingsDto;

    @IsOptional()
    @IsString()
    notes?: string;

    @IsOptional()
    @IsString({ each: true })
    attachments?: string[];
}