import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';
import { CarBooking } from './entity/car-booking.entity';
import { CarService } from './car.service';
import { CarBookingRepository } from './repository/car-booking.repository';

@Module({
  imports: [TypeOrmModule.forFeature([CarBooking])],
  controllers: [],
  providers: [CarService, CarBookingRepository],
  exports: [CarService, CarBookingRepository],
})
export class CarModule {}
