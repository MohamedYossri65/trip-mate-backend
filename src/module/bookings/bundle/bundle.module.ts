import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';
import { Booking } from '../domain/entity/booking.entity';
import { BundleService } from './bundle.service';
import { BundleRepository } from './repository/bundle.repository';
import { BundleBase } from './entity/bundle-base.entity';
import { CarBundle } from './entity/bundle-car.entity';
import { FlightBundle } from './entity/bundle-flight.entity';
import { HotelBundle } from './entity/bundle-hotel.entity';
import { VisaBundle } from './entity/bundle-visa.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Booking, BundleBase, CarBundle, FlightBundle, HotelBundle, VisaBundle])],
  providers: [BundleService, BundleRepository],
  exports: [BundleService, BundleRepository],
})
export class BundleModule {}
