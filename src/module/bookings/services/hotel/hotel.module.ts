import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';
import { HotelBooking } from './entity/hotel-booking.entity';
import { HotelService } from './hotel.service';
import { HotelBookingRepository } from './repository/hotel-booking.repository';


@Module({
  imports: [TypeOrmModule.forFeature([
    HotelBooking,
  ]),
  ],
  controllers: [],
  providers: [HotelService, HotelBookingRepository],
  exports: [HotelService, HotelBookingRepository],
})
export class HotelModule { }
