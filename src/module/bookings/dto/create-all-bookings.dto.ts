import { ApiProperty } from '@nestjs/swagger';
import { ValidateNested, IsOptional, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import {
  CreateBundleBaseDto,
  CreateBundleCarBookingDto,
  CreateBundleFlightBookingDto,
  CreateBundleHotelBookingDto,
  CreateBundleVisaBookingDto,
} from '../bundle/dto/create-bundle-booking.dto';


export class CreateAllBookingsDto {
  @ApiProperty({ type: CreateBundleBaseDto })
  @ValidateNested()
  @Type(() => CreateBundleBaseDto)
  bundleBase: CreateBundleBaseDto;

  @ApiProperty({ required: false, type: [CreateBundleHotelBookingDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBundleHotelBookingDto)
  hotels?: CreateBundleHotelBookingDto[];

  @ApiProperty({ required: false, type: [CreateBundleCarBookingDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBundleCarBookingDto)
  cars?: CreateBundleCarBookingDto[];

  @ApiProperty({ required: false, type: [CreateBundleFlightBookingDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBundleFlightBookingDto)
  flights?: CreateBundleFlightBookingDto[];

  @ApiProperty({ required: false, type: [CreateBundleVisaBookingDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBundleVisaBookingDto)
  visas?: CreateBundleVisaBookingDto[];
}