import { Injectable } from '@nestjs/common';
import { BookingStatus } from '../bookings/domain/enum/booking-status.enum';
import { Offer } from './offer.entity';
import { DataSource } from 'typeorm';
import { Booking } from '../bookings/domain/entity/booking.entity';

@Injectable()
export class OffersService {
  constructor(private readonly dataSource: DataSource) {}

  async createOffer(
    bookingId: bigint,
    officeId: string,
    price: number,
  ): Promise<Offer> {
    return this.dataSource.transaction(async (manager) => {
      const booking = await manager.findOne(Booking, {
        where: { id: bookingId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!booking) throw new Error('Booking not found');

      const offer = manager.create(Offer, {
        booking,
        office: { id: BigInt(officeId) },
        price,
      });

      await manager.save(offer);

      if (booking.status === BookingStatus.WAITING_FOR_OFFERS) {
        booking.changeStatus(BookingStatus.UNDER_NEGOTIATION);
        await manager.save(booking);
      }

      return offer;
    });
  }
}
