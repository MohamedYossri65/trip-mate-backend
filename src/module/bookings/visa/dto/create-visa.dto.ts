import { Type } from "class-transformer";
import { IsDate, IsNotEmpty, IsNumber, IsString } from "class-validator";


export class CreateVisaBookingDto {
    @IsString()
    @IsNotEmpty()
    fingerPrintLocation: string;

    @IsString()
    @IsNotEmpty()
    arrivalCountry: string;

    @IsString()
    @IsNotEmpty()
    visaType: string;

    @IsDate()
    @Type(() => Date)
    departureDate: Date;

    @IsNumber()
    companionsAdults: number = 0;
    
    @IsNumber()
    companionsChildren: number = 0;
}