import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';
import { Booking } from '../domain/entity/booking.entity';
import { BundleService } from './bundle.service';
import { BundleRepository } from './repository/bundle.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Booking])],
  providers: [BundleService, BundleRepository],
  exports: [BundleService, BundleRepository],
})
export class BundleModule {}
