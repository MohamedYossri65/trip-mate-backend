import { ApiProperty } from '@nestjs/swagger';
import { ValidateNested, IsOptional, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateHotelBookingDto } from '../../services/hotel/dto/create-hotel-booking.dto';
import { CreateCarBookingDto } from '../../services/car/dto/create-car-booking.dto';
import { CreateFlightBookingDto } from '../../services/flight/dto/create-flight-booking.dto';
import { CreateVisaBookingDto } from '../../services/visa/dto/create-visa.dto';


export class CreateAllBookingsDto {
  @ApiProperty({ required: false, type: [CreateHotelBookingDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateHotelBookingDto)
  hotels?: CreateHotelBookingDto[];

  @ApiProperty({ required: false, type: [CreateCarBookingDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCarBookingDto)
  cars?: CreateCarBookingDto[];

  @ApiProperty({ required: false, type: [CreateFlightBookingDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFlightBookingDto)
  flights?: CreateFlightBookingDto[];

  @ApiProperty({ required: false, type: [CreateVisaBookingDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVisaBookingDto)
  visas?: CreateVisaBookingDto[];
}