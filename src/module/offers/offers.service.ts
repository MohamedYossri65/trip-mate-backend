import { Injectable } from '@nestjs/common';
import { BookingStatus } from '../bookings/domain/enum/booking-status.enum';
import { Offer } from './entity/offer.entity';
import { DataSource } from 'typeorm';
import { Booking } from '../bookings/domain/entity/booking.entity';
import { CreateCarBookingDto } from '../bookings/services/car/dto/create-car-booking.dto';
import { CarOfferDetails } from './entity/car-offer-details';
import { CarOfferMapper } from './mapper/car-offer.mapper';
import { CreateCarOfferDto } from './dto/create-car-offer.dto';

@Injectable()
export class OffersService {
  constructor(private readonly dataSource: DataSource) {}

  async createOffer(
    bookingId: bigint,
    officeId: string,
    price: number,
  ): Promise<Offer> {
    return this.dataSource.transaction(async (manager) => {
      const booking = await manager
        .createQueryBuilder(Booking, 'booking')
        .where('booking.id = :id', { id: bookingId })
        .setLock('pessimistic_write', undefined, ['booking'])
        .getOne();


      if (!booking) throw new Error('Booking not found');

      const offer = manager.create(Offer, {
        booking,
        office: { accountId: BigInt(officeId) },
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

  async createCarRentalOffer(
    carOfferDetailsDto: CreateCarOfferDto,
    accountId: bigint,
  ): Promise<CarOfferMapper> {
    const carOfferResult = await this.dataSource.transaction(async (manager) => {
      const booking = await manager
        .createQueryBuilder(Booking, 'booking')
        .where('booking.id = :id', { id: carOfferDetailsDto.bookingId })
        .setLock('pessimistic_write', undefined, ['booking'])
        .getOne();


      if (!booking) throw new Error('Booking not found');

      const offer = manager.create(Offer, {
        booking,
        office: { accountId },
        price : carOfferDetailsDto.price,
        offerDuration: carOfferDetailsDto.offerDuration,
      });

      await manager.save(offer);

      const carOfferDetails = manager.create(CarOfferDetails, {
        ...CarOfferMapper.fromDto(carOfferDetailsDto, offer),
      });

      await manager.save(carOfferDetails);

      if (booking.status === BookingStatus.WAITING_FOR_OFFERS) {
        booking.changeStatus(BookingStatus.UNDER_NEGOTIATION);
        await manager.save(booking);
      }

      return offer;
    });

    return this.findOneCarOffer(carOfferResult.id);
  }

  async findOneCarOffer(offerId: bigint): Promise<CarOfferMapper> {
    const carOfferDetails = await this.dataSource.getRepository(CarOfferDetails).findOne({
      where: { offerId },
      relations: [
        'offer' , 
        'offer.office',
        'offer.office.account',
        'offer.booking', 
        'offer.booking.user', 
        'offer.booking.user.account'
      ],
    });
    if (!carOfferDetails) throw new Error('Car offer not found');
    return CarOfferMapper.fromEntities(carOfferDetails);
  }

  async findOffersByBookingId(bookingId: bigint): Promise<CarOfferMapper[]> {
    const carOfferDetailsList = await this.dataSource.getRepository(CarOfferDetails).find({
      where: { offer: { booking: { id: bookingId } } },
      relations: [
        'offer' , 
        'offer.office',
        'offer.office.account',
        'offer.booking', 
        'offer.booking.user', 
        'offer.booking.user.account'
      ],
    });
    return carOfferDetailsList.map(CarOfferMapper.fromEntities);
  }
}
