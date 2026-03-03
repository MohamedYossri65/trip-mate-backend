import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateHotelBookingDto } from './services/hotel/dto/create-hotel-booking.dto';
import { Auth } from 'src/common/guards/auth.decorator';
import { CurrentUser } from 'src/common/guards/user.decorator';
import { Account } from '../account/entity/account.entity';
import { RolesEnum } from 'src/common/enums/roles.enum';
import { SuccessResponse } from 'src/common/interceptors/success-response.interceptor';
import { CreateCarBookingDto } from './services/car/dto/create-car-booking.dto';
import { CreateFlightBookingDto } from './services/flight/dto/create-flight-booking.dto';
import { CreateVisaBookingDto } from './services/visa/dto/create-visa.dto';
import { HotelFilterDto } from './services/hotel/dto/hotel-filter.dto';
import { FlightFilterDto } from './services/flight/dto/flight-filter.dto';
import { CarFilterDto } from './services/car/dto/car-filter.dto';
import { VisaFilterDto } from './services/visa/dto/visa-filter.dto';
import { BundleFilterDto } from './bundle/dto/bundle-filter.dto';
import { CreateAllBookingsDto } from './domain/dto/create-all-bookings.dto';

@ApiTags('bookings')
@Controller({ path: 'bookings', version: '1' })
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) { }

  @Post('hotel')
  @Auth(RolesEnum.USER)
  @ApiOperation({ summary: 'Create a hotel booking' })
  @SuccessResponse('Hotel booking created successfully')
  async createHotelBooking(
    @Body() dto: CreateHotelBookingDto,
    @CurrentUser() account: Account,
  ) {
    return await this.bookingsService.createHotelBooking(
      account.id.toString(),
      dto,
    );
  }

  @Post('car')
  @Auth(RolesEnum.USER)
  @ApiOperation({ summary: 'Create a car booking' })
  @SuccessResponse('Car booking created successfully')
  async createCarBooking(
    @Body() dto: CreateCarBookingDto,
    @CurrentUser() account: Account,
  ) {
    return await this.bookingsService.createCarBooking(
      account.id,
      dto,
    );
  }

  @Post('flight')
  @Auth(RolesEnum.USER)
  @ApiOperation({ summary: 'Create a flight booking' })
  @SuccessResponse('Flight booking created successfully')
  async createFlightBooking(
    @Body() dto: CreateFlightBookingDto,
    @CurrentUser() account: Account,
  ) {
    return await this.bookingsService.createFlightBooking(
      account.id,
      dto,
    );
  }

  @Post('visa')
  @Auth(RolesEnum.USER)
  @ApiOperation({ summary: 'Create a visa booking' })
  @SuccessResponse('Visa booking created successfully')
  async createVisaBooking(
    @Body() dto: CreateVisaBookingDto,
    @CurrentUser() account: Account,
  ) {
    return await this.bookingsService.createVisaBooking(
      account.id,
      dto,
    );
  }

  @Post('bundle')
  @Auth(RolesEnum.USER)
  @ApiOperation({ summary: 'Create multiple bookings at once' })
  @SuccessResponse('Bookings created successfully')
  async createAllBookings(
    @Body() dto: CreateAllBookingsDto,
    @CurrentUser() account: Account,
  ) {
    return this.bookingsService.createAllBookings(account.id, dto);
  }

  // @Get('bookings')
  // @Auth()
  // @ApiOperation({ summary: 'List all bookings with filter, search & pagination' })
  // @SuccessResponse('Bookings retrieved successfully')
  // async findAllBookings(@Query() dto: any) {
  //   return this.bookingsService.findAllBooking(dto);
  // }

  @Get('hotels')
  @Auth()
  @ApiOperation({ summary: 'List hotel bookings with filter, search & pagination' })
  @SuccessResponse('Hotel bookings retrieved successfully')
  async findAllHotels(@Query() dto: HotelFilterDto) {
    return this.bookingsService.findAllHotels(dto);
  }


  @Get('flights')
  @Auth()
  @ApiOperation({ summary: 'List flight bookings with filter, search & pagination' })
  @SuccessResponse('Flight bookings retrieved successfully')
  async findAllFlights(@Query() dto: FlightFilterDto) {
    return this.bookingsService.findAllFlights(dto);
  }

  @Get('cars')
  @Auth()
  @ApiOperation({ summary: 'List car bookings with filter, search & pagination' })
  @SuccessResponse('Car bookings retrieved successfully')
  async findAllCars(@Query() dto: CarFilterDto) {
    return this.bookingsService.findAllCars(dto);
  }

  @Get('visas')
  @Auth()
  @ApiOperation({ summary: 'List visa bookings with filter, search & pagination' })
  @SuccessResponse('Visa bookings retrieved successfully')
  async findAllVisas(@Query() dto: VisaFilterDto) {
    return this.bookingsService.findAllVisas(dto);
  }

  @Get('bundles')
  @Auth()
  @ApiOperation({ summary: 'List bundle (comprehensive trip) bookings with pagination' })
  @SuccessResponse('Bundle bookings retrieved successfully')
  async findAllBundles(@Query() dto: BundleFilterDto) {
    return this.bookingsService.findAllBundles(dto);
  }

  @Get('bundle/:id')
  @Auth()
  @ApiOperation({ summary: 'Get details of a single bundle (comprehensive trip) booking' })
  @SuccessResponse('Bundle booking retrieved successfully')
  async findOneBundle(@Query('id') id: bigint) {
    return this.bookingsService.findOneBundle(id);
  }
}