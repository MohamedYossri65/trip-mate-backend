import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewService } from './review.service';
import { ReviewController } from './review.controller';
import { Review } from './entity/review.entity';
import { Booking } from '../bookings/domain/entity/booking.entity';
import { OfficeProfile } from '../office/entity/office.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Review, Booking, OfficeProfile]),
  ],
  controllers: [ReviewController],
  providers: [ReviewService],
  exports: [ReviewService],
})
export class ReviewModule {}
