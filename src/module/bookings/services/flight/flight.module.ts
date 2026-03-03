import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';
import { FlightService } from './flight.service';
import { FlightBookingRepository } from './repository/flight-booking.repository';
import { FlightBooking } from './entity/flight.-booking.entity';


@Module({
  imports: [TypeOrmModule.forFeature([
    FlightBooking,
  ])],
  controllers: [],
  providers: [ FlightService, FlightBookingRepository],
  exports: [ FlightService, FlightBookingRepository ],
})
export class FlightModule { }
