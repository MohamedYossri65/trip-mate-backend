import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsDate, IsDateString, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

export class CreateBundleBaseDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    fingerPrintLocation: string;

    @ApiPropertyOptional({ default: 0 })
    @IsOptional()
    @IsNumber()
    companionsAdults: number = 0;

    @ApiPropertyOptional({ default: 0 })
    @IsOptional()
    @IsNumber()
    companionsChildren: number = 0;

    @ApiPropertyOptional({ default: 1 })
    @IsOptional()
    @IsInt()
    @Min(1)
    numberOfTrips: number = 1;
}

export class CreateBundleHotelBookingDto {
    @IsBoolean()
    isTherePreferredHotel: boolean;

    @IsOptional()
    @IsString()
    preferredHotelName?: string;

    @IsNumber()
    @Type(() => Number)
    hotelStarRating: number;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => RoomDetail)
    roomDetails: RoomDetail[];

    @IsOptional()
    @IsString()
    notes?: string;
}

export class CreateBundleCarBookingDto {
    @IsString()
    deliveryLocation: string;

    @IsDate()
    @Type(() => Date)
    deliveryDate: Date;

    @IsDate()
    @Type(() => Date)
    returnDate: Date;

    @IsString()
    carType: string;

    @IsString()
    transmissionType: string;

    @IsOptional()
    @IsString()
    carBrand?: string;

    @IsOptional()
    @IsString()
    carModel?: string;

    @IsBoolean()
    hasDrivingLicense: boolean;

    @IsNumber()
    @Type(() => Number)
    driverAge: number;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    drivingExperienceYears?: number;

    @IsBoolean()
    requiresPrivateDriver: boolean;

    @IsBoolean()
    requiresChildSeat: boolean;

    @IsBoolean()
    requiresFullInsurance: boolean;

    @IsOptional()
    @IsString()
    notes?: string;
}
export class CreateBundleFlightBookingDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    ticketGrade: string;
}


export class CreateBundleVisaBookingDto {
    @IsOptional()
    @IsString()
    depretureCountry?: string;

    @IsString()
    arrivalCountry: string;

    @IsString()
    visaType: string;

    @IsDate()
    @Type(() => Date)
    departureDate: Date;

    @IsOptional()
    @IsDate()
    @Type(() => Date)
    returnDate?: Date;
}

export class RoomDetail {
    @IsString()
    roomType: string;
    @IsString()
    accommodationType: string;
}
