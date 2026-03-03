import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { Booking } from './domain/entity/booking.entity';
import { HotelModule } from './services/hotel/hotel.module';
import { FlightModule } from './services/flight/flight.module';
import { CarModule } from './services/car/car.module';
import { VisaModule } from './services/visa/visa.module';
import { BundleModule } from './bundle/bundle.module';
import { BookingRepository } from './domain/repository/booking.repository';

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
