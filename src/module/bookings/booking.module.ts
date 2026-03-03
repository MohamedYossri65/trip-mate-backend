import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { Booking } from './entity/booking.entity';
import { HotelModule } from './hotel/hotel.module';
import { FlightModule } from './flight/flight.module';
import { CarModule } from './car/car.module';
import { VisaModule } from './visa/visa.module';
import { BundleModule } from './bundle/bundle.module';
import { BookingRepository } from './repository/booking.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking]),
    HotelModule,
    FlightModule,
    CarModule,
    VisaModule,
    BundleModule,
  ],
  controllers: [BookingsController],
  providers: [BookingsService, BookingRepository],
  exports: [BookingsService],
})
export class BookingsModule { }
