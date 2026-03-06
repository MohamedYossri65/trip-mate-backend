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

export class RoomDetailsDto {
    @IsString()
    @IsNotEmpty()
    roomType: string;

    @IsString()
    @IsNotEmpty()
    accommodationType: string;
}

export class CreateHotelOfferDto {
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
    destinationCity: string;

    @IsBoolean()
    isTherePreferredHotel: boolean;

    @IsOptional()
    @IsString()
    hotelName?: string;

    @IsInt()
    @Min(1)
    @Max(5)
    starRating: number;

    @IsDate()
    @Type(() => Date)
    checkIn: Date;

    @IsDate()
    @Type(() => Date)
    checkOut: Date;

    @IsInt()
    @Min(1)
    numGuests: number;

    @IsInt()
    @Min(0)
    numChildren: number;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => RoomDetailsDto)
    roomDetails: RoomDetailsDto[];

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
