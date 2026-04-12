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
import { OffersModule } from '../offers/offers.module';
import { ReviewModule } from '../review/review.module';
import { BookingSetting } from './settings/entity/booking-setting.entity';
import { BookingSettingsService } from './settings/booking-settings.service';
import { BookingSettingsController } from './settings/booking-settings.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, BookingSetting]),
    HotelModule,
    FlightModule,
    CarModule,
    VisaModule,
    BundleModule,
    OffersModule,
    ReviewModule,
  ],
  controllers: [BookingsController, BookingSettingsController],
  providers: [BookingsService, BookingRepository, BookingSettingsService],
  exports: [BookingsService, BookingSettingsService],
})
export class BookingsModule {}
