import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationService } from './notification.service';
import { NotificationChannel } from './enums';
import { RolesEnum } from 'src/common/enums/roles.enum';
import {
  TripBookedEvent,
  VisaApprovedEvent,
  BookingStatusChangedEvent,
  NewBookingCreatedEvent,
  NewOfferReceivedEvent,
} from './events';

@Injectable()
export class NotificationListener {
  private readonly logger = new Logger(NotificationListener.name);

  constructor(private readonly notificationService: NotificationService) {}

  @OnEvent('trip.booked')
  async handleTripBooked(event: TripBookedEvent): Promise<void> {
    this.logger.log(`Handling trip.booked event for account=${event.accountId}`);

    await this.notificationService.createAndQueue(
      'TRIP_BOOKED',
      event.accountId,
      {
        country: event.country,
        tripId: event.tripId,
      },
      [NotificationChannel.PUSH, NotificationChannel.IN_APP],
    );
  }

  @OnEvent('visa.approved')
  async handleVisaApproved(event: VisaApprovedEvent): Promise<void> {
    this.logger.log(`Handling visa.approved event for account=${event.accountId}`);

    await this.notificationService.createAndQueue(
      'VISA_APPROVED',
      event.accountId,
      {
        country: event.country,
        visaId: event.visaId,
      },
      [NotificationChannel.PUSH, NotificationChannel.IN_APP],
    );
  }

  @OnEvent('booking.status_changed')
  async handleBookingStatusChanged(event: BookingStatusChangedEvent): Promise<void> {
    this.logger.log(
      `Handling booking.status_changed event for account=${event.accountId}`,
    );

    await this.notificationService.createAndQueue(
      'BOOKING_STATUS_CHANGED',
      event.accountId,
      {
        bookingId: event.bookingId,
        newStatus: event.newStatus,
        bookingType: event.bookingType,
      },
      [NotificationChannel.PUSH, NotificationChannel.IN_APP],
    );
  }

  @OnEvent('new.booking')
  async handleNewBooking(event: NewBookingCreatedEvent): Promise<void> {
    this.logger.log(
      `Handling new.booking event: bookingId=${event.bookingId}, type=${event.bookingType}`,
    );

    const officeAccountIds =
      await this.notificationService.getAccountIdsByRole(RolesEnum.OFFICE);

    for (const accountId of officeAccountIds) {
      await this.notificationService.createAndQueue(
        'NEW_BOOKING',
        accountId,
        {
          bookingId: event.bookingId,
          bookingType: event.bookingType,
        },
        [NotificationChannel.PUSH, NotificationChannel.IN_APP],
      );
    }

    this.logger.log(
      `New booking notification sent to ${officeAccountIds.length} offices`,
    );
  }

  @OnEvent('new.offer')
  async handleNewOffer(event: NewOfferReceivedEvent): Promise<void> {
    this.logger.log(
      `Handling new.offer event for account=${event.accountId}, bookingId=${event.bookingId}`,
    );

    await this.notificationService.createAndQueue(
      'NEW_OFFER_RECEIVED',
      event.accountId,
      {
        bookingId: event.bookingId,
        bookingType: event.bookingType,
        offerPrice: event.offerPrice,
      },
      [NotificationChannel.PUSH, NotificationChannel.IN_APP],
    );
  }
}
