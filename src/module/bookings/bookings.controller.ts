import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateHotelBookingDto } from './services/hotel/dto/create-hotel-booking.dto';
import { Auth } from 'src/common/guards/decorators/auth.decorator';
import { CurrentUser } from 'src/common/guards/decorators/user.decorator';
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
import { BookingFilterDto } from './domain/dto/booking-filter.dto';
import { MyBookingFilterDto } from './domain/dto/my-booking-filter.dto';
import { AdminBookingsFilterDto } from './domain/dto/admin-bookings-filter.dto';
import { BookingServiceGuard } from './settings/guard/booking-service.guard';

@ApiTags('bookings')
@Controller({ path: 'bookings', version: '1' })
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) { }

  @Post('hotel')
  @Auth(RolesEnum.USER)
  @UseGuards(BookingServiceGuard)
  @ApiOperation({ summary: 'Create a hotel booking' })
  @SuccessResponse('Hotel booking created successfully')
  async createHotelBooking(
    @Body() dto: CreateHotelBookingDto,
    @CurrentUser() account: Account,
  ) {
    return await this.bookingsService.createHotelBooking(
      account.id,
      dto,
    );
  }

  @Post('car')
  @Auth(RolesEnum.USER)
  @UseGuards(BookingServiceGuard)
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
  @UseGuards(BookingServiceGuard)
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
  @UseGuards(BookingServiceGuard)
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
  @UseGuards(BookingServiceGuard)
  @ApiOperation({ summary: 'Create multiple bookings at once' })
  @SuccessResponse('Bookings created successfully')
  async createAllBookings(
    @Body() dto: CreateAllBookingsDto,
    @CurrentUser() account: Account,
  ) {
    return this.bookingsService.createAllBookings(account.id, dto);
  }

  @Get('hotels')
  @Auth()
  @ApiOperation({ summary: 'List hotel bookings with filter, search & pagination' })
  @SuccessResponse('Hotel bookings retrieved successfully')
  async findAllHotels(
    @Query() dto: HotelFilterDto,
    @CurrentUser() account: Account,
  ) {
    return this.bookingsService.findAllHotels(dto, account);
  }


  @Get('flights')
  @Auth()
  @ApiOperation({ summary: 'List flight bookings with filter, search & pagination' })
  @SuccessResponse('Flight bookings retrieved successfully')
  async findAllFlights(
    @Query() dto: FlightFilterDto,
    @CurrentUser() account: Account,
  ) {
    return this.bookingsService.findAllFlights(dto, account);
  }

  @Get('cars')
  @Auth()
  @ApiOperation({ summary: 'List car bookings with filter, search & pagination' })
  @SuccessResponse('Car bookings retrieved successfully')
  async findAllCars(
    @Query() dto: CarFilterDto,
    @CurrentUser() account: Account,
  ) {
    return this.bookingsService.findAllCars(dto, account);
  }

  @Get('visas')
  @Auth()
  @ApiOperation({ summary: 'List visa bookings with filter, search & pagination' })
  @SuccessResponse('Visa bookings retrieved successfully')
  async findAllVisas(
    @Query() dto: VisaFilterDto,
    @CurrentUser() account: Account,
  ) {
    return this.bookingsService.findAllVisas(dto, account);
  }

  @Get('bundles')
  @Auth()
  @ApiOperation({ summary: 'List bundle (comprehensive trip) bookings with pagination' })
  @SuccessResponse('Bundle bookings retrieved successfully')
  async findAllBundles(
    @Query() dto: BundleFilterDto,
    @CurrentUser() account: Account,
  ) {
    return this.bookingsService.findAllBundles(dto, account);
  }

  @Get('bundle/:id')
  @Auth()
  @ApiOperation({ summary: 'Get details of a single bundle (comprehensive trip) booking' })
  @SuccessResponse('Bundle booking retrieved successfully')
  async findOneBundle(@Param('id') id: bigint , @CurrentUser() account: Account) {
    return this.bookingsService.findOneBundle(id, account);
  }

  @Get('my')
  @Auth(RolesEnum.USER)
  @ApiOperation({ summary: 'Get current user bookings with pagination' })
  @SuccessResponse('User bookings retrieved successfully')
  async findUserBookings(
    @CurrentUser() account: Account,
    @Query() dto: MyBookingFilterDto,
  ) {
    return this.bookingsService.findUserBookings(account.id, dto);
  }

  @Get('admin/all')
  @Auth(RolesEnum.ADMIN)
  @ApiOperation({
    summary: 'Get all bookings for admin with pagination and optional filters',
  })
  @SuccessResponse('Admin bookings retrieved successfully')
  async findAdminBookings(@Query() dto: AdminBookingsFilterDto) {
    return this.bookingsService.findAdminBookings(dto);
  }

  @Delete('admin/:bookingId')
  @Auth(RolesEnum.ADMIN)
  @ApiOperation({ summary: 'delete a booking (Admin only)' })
  @SuccessResponse('Booking deleted successfully')
  async deleteBooking(@Param('bookingId') bookingId: string) {
    await this.bookingsService.deleteBooking(BigInt(bookingId));
    return { message: 'Booking deleted successfully' };
  }

  @Patch(':bookingId/cancel')
  @Auth(RolesEnum.USER)
  @ApiOperation({ summary: 'Cancel a booking if it is not completed' })
  @SuccessResponse('Booking cancelled successfully')
  async cancelBooking(
    @Param('bookingId') bookingId: string,
    @CurrentUser() account: Account,
  ) {
    return this.bookingsService.cancelBooking(account.id, BigInt(bookingId));
  }

  @Get('home-page')
  @Auth()
  @ApiQuery({ name: 'arrivalCountry', required: false, description: 'Filter by arrival country' })
  @ApiOperation({ summary: 'Get recent bookings for home page display' })
  @SuccessResponse('Home page bookings retrieved successfully')
  async findHomePageBookings(
    @Query('arrivalCountry') arrivalCountry?: string,
  ) {
    return this.bookingsService.findHomePageBookings(arrivalCountry);
  }

  @Get('cars/:bookingId')
  @Auth()
  @ApiOperation({ summary: 'Get car booking details by booking ID' })
  @SuccessResponse('Car booking retrieved successfully')
  async findCarByBookingId(@Param('bookingId') bookingId: bigint , @CurrentUser() account: Account) {
    return this.bookingsService.findOneCarBooking(bookingId, account);
  }

  @Get('flights/:bookingId')
  @Auth()
  @ApiOperation({ summary: 'Get flight booking details by booking ID' })
  @SuccessResponse('Flight booking retrieved successfully')
  async findFlightByBookingId(@Param('bookingId') bookingId: bigint, @CurrentUser() account: Account) {
    return this.bookingsService.findOneFlightBooking(bookingId, account);
  }

  @Get('hotels/:bookingId')
  @Auth()
  @ApiOperation({ summary: 'Get hotel booking details by booking ID' })
  @SuccessResponse('Hotel booking retrieved successfully')
  async findHotelByBookingId(@Param('bookingId') bookingId: bigint ,@CurrentUser() account: Account) {
    return this.bookingsService.findOneHotelBooking(bookingId, account);
  }

  @Get('visas/:bookingId')
  @Auth()
  @ApiOperation({ summary: 'Get visa booking details by booking ID' })
  @SuccessResponse('Visa booking retrieved successfully')
  async findVisaByBookingId(@Param('bookingId') bookingId: bigint, @CurrentUser() account: Account) {
    return this.bookingsService.findOneVisaBooking(bookingId, account);
  }
}