import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';
import { VisaBooking } from './entity/visa-booking.entity';
import { VisaService } from './visa.service';
import { VisaBookingRepository } from './repository/visa-booking.repository';

@Module({
  imports: [TypeOrmModule.forFeature([VisaBooking])],
  controllers: [],
  providers: [VisaService, VisaBookingRepository],
  exports: [VisaService, VisaBookingRepository],
})
export class VisaModule {}
