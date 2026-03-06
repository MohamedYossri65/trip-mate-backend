import { Type } from 'class-transformer';
import {
    IsArray,
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
} from 'class-validator';
import { RoomDetailsDto } from './create-hotel-offer.dto';

export class UpdateHotelOfferDto {
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
    destinationCity?: string;

    @IsOptional()
    @IsBoolean()
    isTherePreferredHotel?: boolean;

    @IsOptional()
    @IsString()
    hotelName?: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(5)
    starRating?: number;

    @IsOptional()
    @IsDate()
    @Type(() => Date)
    checkIn?: Date;

    @IsOptional()
    @IsDate()
    @Type(() => Date)
    checkOut?: Date;

    @IsOptional()
    @IsInt()
    @Min(1)
    numGuests?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    numChildren?: number;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => RoomDetailsDto)
    roomDetails?: RoomDetailsDto[];

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
