import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationTemplate } from '../entity/notification-template.entity';
import { NotificationChannel } from '../enums';

interface TemplateSeed {
  templateKey: string;
  language: string;
  channel: NotificationChannel;
  titleTemplate: string;
  bodyTemplate: string;
  direction: string;
}

@Injectable()
export class NotificationTemplateSeed implements OnModuleInit {
  private readonly logger = new Logger(NotificationTemplateSeed.name);

  constructor(
    @InjectRepository(NotificationTemplate)
    private readonly templateRepo: Repository<NotificationTemplate>,
  ) {}

  async onModuleInit(): Promise<void> {
    this.logger.log('Syncing notification templates...');

    const seeds: TemplateSeed[] = [
      // ─── TRIP_BOOKED ─────────────────────────────────
      {
        templateKey: 'TRIP_BOOKED',
        language: 'en',
        channel: NotificationChannel.PUSH,
        titleTemplate: 'Trip Booked Successfully',
        bodyTemplate: 'Your trip to {{country}} has been confirmed.',
        direction: 'ltr',
      },
      {
        templateKey: 'TRIP_BOOKED',
        language: 'ar',
        channel: NotificationChannel.PUSH,
        titleTemplate: 'تم حجز الرحلة بنجاح',
        bodyTemplate: 'تم تأكيد رحلتك إلى {{country}}.',
        direction: 'rtl',
      },
      {
        templateKey: 'TRIP_BOOKED',
        language: 'en',
        channel: NotificationChannel.IN_APP,
        titleTemplate: 'Trip Booked Successfully',
        bodyTemplate: 'Your trip to {{country}} has been confirmed.',
        direction: 'ltr',
      },
      {
        templateKey: 'TRIP_BOOKED',
        language: 'ar',
        channel: NotificationChannel.IN_APP,
        titleTemplate: 'تم حجز الرحلة بنجاح',
        bodyTemplate: 'تم تأكيد رحلتك إلى {{country}}.',
        direction: 'rtl',
      },

      // ─── VISA_APPROVED ───────────────────────────────
      {
        templateKey: 'VISA_APPROVED',
        language: 'en',
        channel: NotificationChannel.PUSH,
        titleTemplate: 'Visa Approved',
        bodyTemplate: 'Your visa to {{country}} has been approved.',
        direction: 'ltr',
      },
      {
        templateKey: 'VISA_APPROVED',
        language: 'ar',
        channel: NotificationChannel.PUSH,
        titleTemplate: 'تمت الموافقة على التأشيرة',
        bodyTemplate: 'تمت الموافقة على تأشيرتك إلى {{country}}.',
        direction: 'rtl',
      },
      {
        templateKey: 'VISA_APPROVED',
        language: 'en',
        channel: NotificationChannel.IN_APP,
        titleTemplate: 'Visa Approved',
        bodyTemplate: 'Your visa to {{country}} has been approved.',
        direction: 'ltr',
      },
      {
        templateKey: 'VISA_APPROVED',
        language: 'ar',
        channel: NotificationChannel.IN_APP,
        titleTemplate: 'تمت الموافقة على التأشيرة',
        bodyTemplate: 'تمت الموافقة على تأشيرتك إلى {{country}}.',
        direction: 'rtl',
      },

      // ─── BOOKING_STATUS_CHANGED ──────────────────────
      {
        templateKey: 'BOOKING_STATUS_CHANGED',
        language: 'en',
        channel: NotificationChannel.PUSH,
        titleTemplate: 'Booking Update',
        bodyTemplate: 'Your {{bookingType}} booking #{{bookingId}} status changed to {{newStatus}}.',
        direction: 'ltr',
      },
      {
        templateKey: 'BOOKING_STATUS_CHANGED',
        language: 'ar',
        channel: NotificationChannel.PUSH,
        titleTemplate: 'تحديث الحجز',
        bodyTemplate: 'حالة حجز {{bookingType}} رقم #{{bookingId}} تغيرت إلى {{newStatus}}.',
        direction: 'rtl',
      },
      {
        templateKey: 'BOOKING_STATUS_CHANGED',
        language: 'en',
        channel: NotificationChannel.IN_APP,
        titleTemplate: 'Booking Update',
        bodyTemplate: 'Your {{bookingType}} booking #{{bookingId}} status changed to {{newStatus}}.',
        direction: 'ltr',
      },
      {
        templateKey: 'BOOKING_STATUS_CHANGED',
        language: 'ar',
        channel: NotificationChannel.IN_APP,
        titleTemplate: 'تحديث الحجز',
        bodyTemplate: 'حالة حجز {{bookingType}} رقم #{{bookingId}} تغيرت إلى {{newStatus}}.',
        direction: 'rtl',
      },

      // ─── NEW_BOOKING (sent to all offices) ───────────
      {
        templateKey: 'NEW_BOOKING',
        language: 'en',
        channel: NotificationChannel.PUSH,
        titleTemplate: 'New Booking Available',
        bodyTemplate: 'A new {{bookingType}} booking #{{bookingId}} is waiting for offers.',
        direction: 'ltr',
      },
      {
        templateKey: 'NEW_BOOKING',
        language: 'ar',
        channel: NotificationChannel.PUSH,
        titleTemplate: 'حجز جديد متاح',
        bodyTemplate: 'حجز {{bookingType}} جديد رقم #{{bookingId}} بانتظار العروض.',
        direction: 'rtl',
      },
      {
        templateKey: 'NEW_BOOKING',
        language: 'en',
        channel: NotificationChannel.IN_APP,
        titleTemplate: 'New Booking Available',
        bodyTemplate: 'A new {{bookingType}} booking #{{bookingId}} is waiting for offers.',
        direction: 'ltr',
      },
      {
        templateKey: 'NEW_BOOKING',
        language: 'ar',
        channel: NotificationChannel.IN_APP,
        titleTemplate: 'حجز جديد متاح',
        bodyTemplate: 'حجز {{bookingType}} جديد رقم #{{bookingId}} بانتظار العروض.',
        direction: 'rtl',
      },

      // ─── NEW_OFFER_RECEIVED (sent to booking owner) ──
      {
        templateKey: 'NEW_OFFER_RECEIVED',
        language: 'en',
        channel: NotificationChannel.PUSH,
        titleTemplate: 'New Offer Received',
        bodyTemplate: 'You received a new offer of {{offerPrice}} on your {{bookingType}} booking #{{bookingId}}.',
        direction: 'ltr',
      },
      {
        templateKey: 'NEW_OFFER_RECEIVED',
        language: 'ar',
        channel: NotificationChannel.PUSH,
        titleTemplate: 'عرض جديد',
        bodyTemplate: 'تلقيت عرضاً جديداً بقيمة {{offerPrice}} على حجز {{bookingType}} رقم #{{bookingId}}.',
        direction: 'rtl',
      },
      {
        templateKey: 'NEW_OFFER_RECEIVED',
        language: 'en',
        channel: NotificationChannel.IN_APP,
        titleTemplate: 'New Offer Received',
        bodyTemplate: 'You received a new offer of {{offerPrice}} on your {{bookingType}} booking #{{bookingId}}.',
        direction: 'ltr',
      },
      {
        templateKey: 'NEW_OFFER_RECEIVED',
        language: 'ar',
        channel: NotificationChannel.IN_APP,
        titleTemplate: 'عرض جديد',
        bodyTemplate: 'تلقيت عرضاً جديداً بقيمة {{offerPrice}} على حجز {{bookingType}} رقم #{{bookingId}}.',
        direction: 'rtl',
      },
    ];

    let created = 0;
    for (const seed of seeds) {
      const existing = await this.templateRepo.findOne({
        where: {
          templateKey: seed.templateKey,
          language: seed.language,
          channel: seed.channel,
        },
      });

      if (!existing) {
        const template = this.templateRepo.create(seed);
        await this.templateRepo.save(template);
        created++;
      }
    }

    this.logger.log(`Template sync complete: ${created} new, ${seeds.length - created} already existed.`);
  }
}
