import {
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
    IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateHotelBookingDto {
    @IsString()
    @IsNotEmpty()
    arrivalCountry: string;

    @IsString()
    @IsNotEmpty()
    arrivalCity: string;

    @IsBoolean()
    isTherePreferredHotel: boolean;

    @IsOptional()
    @IsString()
    preferredHotelName?: string;

    @IsInt()
    @IsOptional()
    hotelStarRating?: number;

    @IsDate()
    @Type(() => Date)
    checkInDate: Date;

    @IsDate()
    @Type(() => Date)
    checkOutDate: Date;

    @IsInt()
    @Min(1)
    numberOfGuests: number;

    @IsInt()
    @Min(0)
    numberOfChildren: number;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => RoomDetailsDto)
    roomDetails: RoomDetailsDto[];

    @IsOptional()
    @IsString()
    notes?: string;
}


export class RoomDetailsDto {
    @IsString()
    @IsNotEmpty()
    roomType: string;

    @IsString()
    @IsNotEmpty()
    accommodationType: string;
}

