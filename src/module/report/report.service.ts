import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Account } from '../account/entity/account.entity';
import { Offer } from '../offers/entity/offer.entity';
import { OfferStatus } from '../offers/enum/offer-status.enum';
import { RolesEnum } from 'src/common/enums/roles.enum';
import { OfficeService } from '../office/office.service';
import { PaymentTransaction } from '../payment/entity/payment-transaction.entity';
import { PaymentStatus } from '../payment/enum/payment-status.enum';
import { PaymentType } from '../payment/enum/payment-type.enum';
import { OfficeProfile } from '../office/entity/office.entity';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { UserProfile } from '../user/entity/user.entity';
import { Booking } from '../bookings/domain/entity/booking.entity';
import { BookingStatus } from '../bookings/domain/enum/booking-status.enum';
import { AdminNamePaginationQueryDto } from './dto/admin-name-pagination-query.dto';

@Injectable()
export class ReportService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly officeService: OfficeService,
  ) {}

  async getOfficePerformance(
    accountId: bigint,
    fromDate?: string,
    toDate?: string,
  ) {
    const officeAccountId = await this.resolveOfficeAccountId(accountId);
    const now = new Date();

    const endDate = toDate ? new Date(toDate) : now;
    const startDate = fromDate
      ? new Date(fromDate)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid fromDate or toDate');
    }

    if (startDate > endDate) {
      throw new BadRequestException('fromDate cannot be after toDate');
    }

    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const offerRepo = this.dataSource.getRepository(Offer);

    const [acceptedOffers, rejectedOffers, totalInteractions] = await Promise.all([
      offerRepo
        .createQueryBuilder('offer')
        .where('offer.office_id = :officeId', { officeId: officeAccountId })
        .andWhere('offer.status = :status', { status: OfferStatus.ACCEPTED })
        .andWhere('offer."createdAt" BETWEEN :startDate AND :endDate', {
          startDate,
          endDate,
        })
        .getCount(),
      offerRepo
        .createQueryBuilder('offer')
        .where('offer.office_id = :officeId', { officeId: officeAccountId })
        .andWhere('offer.status = :status', { status: OfferStatus.REJECTED })
        .andWhere('offer."createdAt" BETWEEN :startDate AND :endDate', {
          startDate,
          endDate,
        })
        .getCount(),
      offerRepo
        .createQueryBuilder('offer')
        .where('offer.office_id = :officeId', { officeId: officeAccountId })
        .andWhere('offer."createdAt" BETWEEN :startDate AND :endDate', {
          startDate,
          endDate,
        })
        .getCount(),
    ]);

    const [
      currentMonthAccepted,
      previousMonthAccepted,
      currentMonthRejected,
      previousMonthRejected,
      currentMonthOffers,
      previousMonthOffers,
    ] = await Promise.all([
      offerRepo
        .createQueryBuilder('offer')
        .where('offer.office_id = :officeId', { officeId: officeAccountId })
        .andWhere('offer.status = :status', { status: OfferStatus.ACCEPTED })
        .andWhere('offer."createdAt" >= :currentMonthStart', { currentMonthStart })
        .getCount(),
      offerRepo
        .createQueryBuilder('offer')
        .where('offer.office_id = :officeId', { officeId: officeAccountId })
        .andWhere('offer.status = :status', { status: OfferStatus.ACCEPTED })
        .andWhere('offer."createdAt" >= :previousMonthStart', {
          previousMonthStart,
        })
        .andWhere('offer."createdAt" < :currentMonthStart', { currentMonthStart })
        .getCount(),
      offerRepo
        .createQueryBuilder('offer')
        .where('offer.office_id = :officeId', { officeId: officeAccountId })
        .andWhere('offer.status = :status', { status: OfferStatus.REJECTED })
        .andWhere('offer."createdAt" >= :currentMonthStart', { currentMonthStart })
        .getCount(),
      offerRepo
        .createQueryBuilder('offer')
        .where('offer.office_id = :officeId', { officeId: officeAccountId })
        .andWhere('offer.status = :status', { status: OfferStatus.REJECTED })
        .andWhere('offer."createdAt" >= :previousMonthStart', {
          previousMonthStart,
        })
        .andWhere('offer."createdAt" < :currentMonthStart', { currentMonthStart })
        .getCount(),
      offerRepo
        .createQueryBuilder('offer')
        .where('offer.office_id = :officeId', { officeId: officeAccountId })
        .andWhere('offer."createdAt" >= :currentMonthStart', { currentMonthStart })
        .getCount(),
      offerRepo
        .createQueryBuilder('offer')
        .where('offer.office_id = :officeId', { officeId: officeAccountId })
        .andWhere('offer."createdAt" >= :previousMonthStart', {
          previousMonthStart,
        })
        .andWhere('offer."createdAt" < :currentMonthStart', { currentMonthStart })
        .getCount(),
    ]);

    const acceptedOffersOverTimeRaw = await offerRepo
      .createQueryBuilder('offer')
      .select('DATE_TRUNC(\'day\', offer."createdAt")::date', 'day')
      .addSelect('COUNT(*)', 'accepted_count')
      .addSelect('COALESCE(SUM(offer.price), 0)', 'total_revenue')
      .where('offer.office_id = :officeId', { officeId: officeAccountId })
      .andWhere('offer.status = :status', { status: OfferStatus.ACCEPTED })
      .andWhere('offer."createdAt" BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('DATE_TRUNC(\'day\', offer."createdAt")::date')
      .orderBy('DATE_TRUNC(\'day\', offer."createdAt")::date', 'ASC')
      .getRawMany();

    const totalInteractionsOverTimeRaw = await offerRepo
      .createQueryBuilder('offer')
      .select('DATE_TRUNC(\'day\', offer."createdAt")::date', 'day')
      .addSelect('COUNT(*)', 'total_offers')
      .where('offer.office_id = :officeId', { officeId: officeAccountId })
      .andWhere('offer."createdAt" BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('DATE_TRUNC(\'day\', offer."createdAt")::date')
      .orderBy('DATE_TRUNC(\'day\', offer."createdAt")::date', 'ASC')
      .getRawMany();

    const monthOverMonthAcceptedPct =
      previousMonthAccepted === 0
        ? null
        : Number(
            (
              ((currentMonthAccepted - previousMonthAccepted) * 100) /
              previousMonthAccepted
            ).toFixed(2),
          );

    const monthOverMonthRejectedPct =
      previousMonthRejected === 0
        ? null
        : Number(
            (
              ((currentMonthRejected - previousMonthRejected) * 100) /
              previousMonthRejected
            ).toFixed(2),
          );

    const monthOverMonthoffersPct =
      previousMonthOffers === 0
        ? null
        : Number(
            (
              ((currentMonthOffers - previousMonthOffers) * 100) /
              previousMonthOffers
            ).toFixed(2),
          );


    return {
      officeAccountId,
      period: {
        fromDate: startDate,
        toDate: endDate,
      },
      office :await this.officeService.getOfficeData(officeAccountId),
      summary: {
        acceptedOffers,
        rejectedOffers,
        totalInteractions,
        monthOverMonthAcceptedPct,
        monthOverMonthRejectedPct,
        monthOverMonthoffersPct,
      },
      charts: {
        acceptedOffersOverTime: acceptedOffersOverTimeRaw.map((row) => ({
          day: row.day,
          acceptedCount: this.toNumber(row.accepted_count),
          totalRevenue: this.toNumber(row.total_revenue),
        })),
        totalInteractionsOverTime: totalInteractionsOverTimeRaw.map((row) => ({
          day: row.day,
          totalOffers: this.toNumber(row.total_offers),
        })),
      },
    };
  }

  async getOfficeDailyProfit(accountId: bigint, month?: number, year?: number) {
    const officeAccountId = await this.resolveOfficeAccountId(accountId);
    const now = new Date();
    const selectedYear = year ?? now.getFullYear();
    const selectedMonth = month ?? now.getMonth() + 1;

    if (selectedMonth < 1 || selectedMonth > 12) {
      throw new BadRequestException('month must be between 1 and 12');
    }

    const startDate = new Date(selectedYear, selectedMonth - 1, 1, 0, 0, 0, 0);
    const endDate = new Date(selectedYear, selectedMonth, 0, 23, 59, 59, 999);

    const offerRepo = this.dataSource.getRepository(Offer);
    const rawDailyProfit = await offerRepo
      .createQueryBuilder('offer')
      .select('DATE_TRUNC(\'day\', offer."createdAt")::date', 'day')
      .addSelect('COALESCE(SUM(offer.price), 0)', 'profit')
      .where('offer.office_id = :officeId', { officeId: officeAccountId })
      .andWhere('offer.status = :status', { status: OfferStatus.ACCEPTED })
      .andWhere('offer."createdAt" BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('DATE_TRUNC(\'day\', offer."createdAt")::date')
      .orderBy('DATE_TRUNC(\'day\', offer."createdAt")::date', 'ASC')
      .getRawMany();

    const chart = this.buildMonthlyDaySeries(selectedYear, selectedMonth);
    const profitByDay = new Map<string, number>();

    for (const row of rawDailyProfit) {
      profitByDay.set(String(row.day), this.toNumber(row.profit));
    }

    const result = chart.map((item) => ({
      day: item.day,
      profit: profitByDay.get(item.day) ?? 0,
    }));

    return {
      officeAccountId,
      period: {
        month: selectedMonth,
        year: selectedYear,
        fromDate: startDate,
        toDate: endDate,
      },
      chart: result,
      totalProfit: result.reduce((sum, item) => sum + item.profit, 0),
    };
  }



  //Admin REPORTS
  async adminHomeSummaryReport() {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const offerRepo = this.dataSource.getRepository(Offer);
    const accountRepo = this.dataSource.getRepository(Account);
    const officeRepo = this.dataSource.getRepository(OfficeProfile);

    const [currentAcceptedOffers, previousAcceptedOffers, currentRejectedOffers, previousRejectedOffers, currentNewCustomers, previousNewCustomers, allUsersCount, allOfficesCount] =
      await Promise.all([
        offerRepo
          .createQueryBuilder('offer')
          .where('offer.status = :status', { status: OfferStatus.ACCEPTED })
          .andWhere('offer."createdAt" >= :currentMonthStart', {
            currentMonthStart,
          })
          .getCount(),
        offerRepo
          .createQueryBuilder('offer')
          .where('offer.status = :status', { status: OfferStatus.ACCEPTED })
          .andWhere('offer."createdAt" >= :previousMonthStart', {
            previousMonthStart,
          })
          .andWhere('offer."createdAt" < :currentMonthStart', {
            currentMonthStart,
          })
          .getCount(),
        offerRepo
          .createQueryBuilder('offer')
          .where('offer.status = :status', { status: OfferStatus.REJECTED })
          .andWhere('offer."createdAt" >= :currentMonthStart', {
            currentMonthStart,
          })
          .getCount(),
        offerRepo
          .createQueryBuilder('offer')
          .where('offer.status = :status', { status: OfferStatus.REJECTED })
          .andWhere('offer."createdAt" >= :previousMonthStart', {
            previousMonthStart,
          })
          .andWhere('offer."createdAt" < :currentMonthStart', {
            currentMonthStart,
          })
          .getCount(),
        accountRepo
          .createQueryBuilder('account')
          .where('account.role = :role', { role: RolesEnum.USER })
          .andWhere('account."createdAt" >= :currentMonthStart', {
            currentMonthStart,
          })
          .getCount(),
        accountRepo
          .createQueryBuilder('account')
          .where('account.role = :role', { role: RolesEnum.USER })
          .andWhere('account."createdAt" >= :previousMonthStart', {
            previousMonthStart,
          })
          .andWhere('account."createdAt" < :currentMonthStart', {
            currentMonthStart,
          })
          .getCount(),
        accountRepo
          .createQueryBuilder('account')
          .where('account.role = :role', { role: RolesEnum.USER })
          .getCount(),
        officeRepo
          .createQueryBuilder('office')
          .getCount(),
      ]);

    return {
      period: {
        currentMonthStart,
        previousMonthStart,
      },
      cards: [
        {
          key: 'acceptedOffers',
          label: 'successfulOffers',
          value: currentAcceptedOffers,
          previousValue: previousAcceptedOffers,
          monthOverMonthPct: this.calculateMonthOverMonthPct(
            currentAcceptedOffers,
            previousAcceptedOffers,
          ),
        },
        {
          key: 'rejectedOffers',
          label: 'rejectedOffers',
          value: currentRejectedOffers,
          previousValue: previousRejectedOffers,
          monthOverMonthPct: this.calculateMonthOverMonthPct(
            currentRejectedOffers,
            previousRejectedOffers,
          ),
        },
        {
          key: 'newCustomers',
          label: 'newCustomers',
          value: currentNewCustomers,
          previousValue: previousNewCustomers,
          monthOverMonthPct: this.calculateMonthOverMonthPct(
            currentNewCustomers,
            previousNewCustomers,
          ),
        },
        {
          key: 'allUsers',
          label: 'allUsers',
          value: allUsersCount,
          previousValue: null,
          monthOverMonthPct: null,
        },
        {
          key: 'allOffices',
          label: 'allOffices',
          value: allOfficesCount,
          previousValue: null,
          monthOverMonthPct: null,
        },
      ],
    };
  }


  async topOffices() {
    const offerRepo = this.dataSource.getRepository(Offer);
    const topOfficesAcceptedOffers = await offerRepo
      .createQueryBuilder('offer')
      .leftJoin('offer.office', 'office')
      .select('office.accountId', 'officeId')
      .addSelect('office.officeName', 'officeName')
      .addSelect('office.logoUrl', 'officeLogo')
      .addSelect('COUNT(offer.id)', 'allOffersCount')
      .addSelect(
        'COUNT(CASE WHEN offer.status = :acceptedStatus THEN 1 END)',
        'acceptedCount',
      )
      .setParameter('acceptedStatus', OfferStatus.ACCEPTED)
      .groupBy('office.accountId')
      .addGroupBy('office.officeName')
      .addGroupBy('office.logoUrl')
      .orderBy('"acceptedCount"', 'DESC')
      .limit(5)
      .getRawMany();

    return topOfficesAcceptedOffers.map((row) => ({
      officeId: row.officeId,
      officeName: row.officeName,
      logoUrl:`${process.env.IMAGEKIT_URL_ENDPOINT}${row.officeLogo}`,
      allOffersCount: this.toNumber(row.allOffersCount),
      acceptedCount: this.toNumber(row.acceptedCount),
    }));
  }


  async adminAcceptedOffersChart(
    fromDate?: string,
    toDate?: string,
  ) {
    if (!fromDate || !toDate) {
      throw new BadRequestException('fromDate and toDate are required');
    }

    const startDate = new Date(fromDate);
    const endDate = new Date(toDate);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid fromDate or toDate');
    }

    if (startDate > endDate) {
      throw new BadRequestException('fromDate cannot be after toDate');
    }

    const offerRepo = this.dataSource.getRepository(Offer);

    const rawDaily = await offerRepo
      .createQueryBuilder('offer')
      .select('DATE_TRUNC(\'day\', offer."createdAt")::date', 'day')
      .addSelect('COUNT(*)', 'accepted_count')
      .addSelect('COALESCE(SUM(offer.price), 0)', 'total_revenue')
      .where('offer.status = :status', { status: OfferStatus.ACCEPTED })
      .andWhere('offer."createdAt" BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('DATE_TRUNC(\'day\', offer."createdAt")::date')
      .orderBy('DATE_TRUNC(\'day\', offer."createdAt")::date', 'ASC')
      .getRawMany();

    const seriesStart = new Date(startDate);
    seriesStart.setUTCHours(0, 0, 0, 0);
    const seriesEnd = new Date(endDate);
    seriesEnd.setUTCHours(0, 0, 0, 0);

    const dataByDay = new Map<
      string,
      { acceptedCount: number; totalRevenue: number }
    >();

    for (const row of rawDaily) {
      const dayKey = new Date(row.day).toISOString().split('T')[0];
      dataByDay.set(dayKey, {
        acceptedCount: this.toNumber(row.accepted_count),
        totalRevenue: this.toNumber(row.total_revenue),
      });
    }

    const days: Array<{
      day: string;
      acceptedCount: number;
      totalRevenue: number;
    }> = [];

    for (
      const cursor = new Date(seriesStart);
      cursor <= seriesEnd;
      cursor.setUTCDate(cursor.getUTCDate() + 1)
    ) {
      const dayKey = cursor.toISOString().split('T')[0];
      const daily = dataByDay.get(dayKey);
      days.push({
        day: new Date(cursor).toISOString(),
        acceptedCount: daily?.acceptedCount ?? 0,
        totalRevenue: daily?.totalRevenue ?? 0,
      });
    }

    return {
      period: { fromDate: startDate, toDate: endDate },
      totalAccepted: days.reduce((sum, d) => sum + d.acceptedCount, 0),
      totalRevenue: days.reduce((sum, d) => sum + d.totalRevenue, 0),
      days,
    };
  }


  async adminNewAccountsChart(fromDate?: string, toDate?: string) {
    if (!fromDate || !toDate) {
      throw new BadRequestException('fromDate and toDate are required');
    }

    const startDate = new Date(fromDate);
    const endDate = new Date(toDate);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid fromDate or toDate');
    }

    if (startDate > endDate) {
      throw new BadRequestException('fromDate cannot be after toDate');
    }

    const accountRepo = this.dataSource.getRepository(Account);

    const rawDaily = await accountRepo
      .createQueryBuilder('account')
      .select('DATE_TRUNC(\'day\', account."createdAt")::date', 'day')
      .addSelect('COUNT(*)', 'count')
      .where('account.role = :role', { role: RolesEnum.USER })
      .andWhere('account."createdAt" BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('DATE_TRUNC(\'day\', account."createdAt")::date')
      .orderBy('DATE_TRUNC(\'day\', account."createdAt")::date', 'ASC')
      .getRawMany();

    const seriesStart = new Date(startDate);
    seriesStart.setUTCHours(0, 0, 0, 0);
    const seriesEnd = new Date(endDate);
    seriesEnd.setUTCHours(0, 0, 0, 0);

    const dataByDay = new Map<string, number>();
    for (const row of rawDaily) {
      const dayKey = new Date(row.day).toISOString().split('T')[0];
      dataByDay.set(dayKey, this.toNumber(row.count));
    }

    const days: Array<{ day: string; count: number }> = [];

    for (
      const cursor = new Date(seriesStart);
      cursor <= seriesEnd;
      cursor.setUTCDate(cursor.getUTCDate() + 1)
    ) {
      const dayKey = cursor.toISOString().split('T')[0];
      days.push({
        day: new Date(cursor).toISOString(),
        count: dataByDay.get(dayKey) ?? 0,
      });
    }

    return {
      period: { fromDate: startDate, toDate: endDate },
      totalNewAccounts: days.reduce((sum, d) => sum + d.count, 0),
      days,
    };
  }

  async adminPaymentSummaryReport() {
    const paymentRepo = this.dataSource.getRepository(PaymentTransaction);

    const [
      totalSuccessTransactionsAmountRaw,
      subscriptionSuccessAmountRaw,
      bookingCommissionAmountRaw,
    ] = await Promise.all([
      paymentRepo
        .createQueryBuilder('payment')
        .select('COALESCE(SUM(payment.amount), 0)', 'total')
        .where('payment.status = :successStatus', {
          successStatus: PaymentStatus.SUCCESS,
        })
        .getRawOne<{ total: string | number }>(),
      paymentRepo
        .createQueryBuilder('payment')
        .select('COALESCE(SUM(payment.amount), 0)', 'total')
        .where('payment.status = :successStatus', {
          successStatus: PaymentStatus.SUCCESS,
        })
        .andWhere('payment.type = :subscriptionType', {
          subscriptionType: PaymentType.SUBSCRIPTION,
        })
        .getRawOne<{ total: string | number }>(),
      paymentRepo
        .createQueryBuilder('payment')
        .select('COALESCE(SUM(payment.appCommissionAmount), 0)', 'total')
        .where('payment.status = :successStatus', {
          successStatus: PaymentStatus.SUCCESS,
        })
        .andWhere('payment.type IN (:...bookingTypes)', {
          bookingTypes: [PaymentType.BOOKING_PARTIAL, PaymentType.BOOKING_FULL],
        })
        .getRawOne<{ total: string | number }>(),
    ]);

    const totalSuccessTransactionsAmount = this.toNumber(
      totalSuccessTransactionsAmountRaw?.total,
    );
    const totalSubscriptionAmount = this.toNumber(
      subscriptionSuccessAmountRaw?.total,
    );
    const totalBookingAppCommissionAmount = this.toNumber(
      bookingCommissionAmountRaw?.total,
    );

    return {
      totalSuccessTransactionsAmount,
      totalSubscriptionAmount,
      totalBookingAppCommissionAmount,
      totalAdminRevenueAmount: totalSubscriptionAmount + totalBookingAppCommissionAmount
    };
  }

  async adminPaymentSummaryChart(fromDate?: string, toDate?: string) {
    if (!fromDate || !toDate) {
      throw new BadRequestException('fromDate and toDate are required');
    }

    const startDate = new Date(fromDate);
    const endDate = new Date(toDate);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid fromDate or toDate');
    }

    if (startDate > endDate) {
      throw new BadRequestException('fromDate cannot be after toDate');
    }

    const paymentRepo = this.dataSource.getRepository(PaymentTransaction);

    const rawDaily = await paymentRepo
      .createQueryBuilder('payment')
      .select('DATE_TRUNC(\'day\', payment."createdAt")::date', 'day')
      .addSelect('COALESCE(SUM(payment.amount), 0)', 'total_success_transactions_amount')
      .addSelect(
        `COALESCE(SUM(CASE
          WHEN payment.type = :subscriptionType THEN payment.amount
          ELSE 0
        END), 0)`,
        'total_subscription_amount',
      )
      .addSelect(
        `COALESCE(SUM(CASE
          WHEN payment.type IN (:...bookingTypes) THEN payment."appCommissionAmount"
          ELSE 0
        END), 0)`,
        'total_booking_app_commission_amount',
      )
      .where('payment.status = :successStatus', {
        successStatus: PaymentStatus.SUCCESS,
      })
      .andWhere('payment."createdAt" BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .setParameter('subscriptionType', PaymentType.SUBSCRIPTION)
      .setParameter('bookingTypes', [
        PaymentType.BOOKING_PARTIAL,
        PaymentType.BOOKING_FULL,
      ])
      .groupBy('DATE_TRUNC(\'day\', payment."createdAt")::date')
      .orderBy('DATE_TRUNC(\'day\', payment."createdAt")::date', 'ASC')
      .getRawMany();

    const seriesStart = new Date(startDate);
    seriesStart.setUTCHours(0, 0, 0, 0);
    const seriesEnd = new Date(endDate);
    seriesEnd.setUTCHours(0, 0, 0, 0);

    const dataByDay = new Map<
      string,
      {
        totalSuccessTransactionsAmount: number;
        totalSubscriptionAmount: number;
        totalBookingAppCommissionAmount: number;
      }
    >();

    for (const row of rawDaily) {
      const dayKey = new Date(row.day).toISOString().split('T')[0];
      dataByDay.set(dayKey, {
        totalSuccessTransactionsAmount: this.toNumber(
          row.total_success_transactions_amount,
        ),
        totalSubscriptionAmount: this.toNumber(row.total_subscription_amount),
        totalBookingAppCommissionAmount: this.toNumber(
          row.total_booking_app_commission_amount,
        ),
      });
    }

    const totalSuccessTransactionsAmountChart: Array<{ day: string; totalAmount: number }> = [];
    const totalSubscriptionAmountChart: Array<{ day: string; totalAmount: number }> = [];
    const totalBookingAppCommissionAmountChart: Array<{ day: string; totalAmount: number }> = [];
    const totalAdminRevenueAmountChart: Array<{ day: string; totalAmount: number }> = [];

    for (
      const cursor = new Date(seriesStart);
      cursor <= seriesEnd;
      cursor.setUTCDate(cursor.getUTCDate() + 1)
    ) {
      const dayKey = cursor.toISOString().split('T')[0];
      const daily = dataByDay.get(dayKey);

      const totalSuccessTransactionsAmount =
        daily?.totalSuccessTransactionsAmount ?? 0;
      const totalSubscriptionAmount = daily?.totalSubscriptionAmount ?? 0;
      const totalBookingAppCommissionAmount =
        daily?.totalBookingAppCommissionAmount ?? 0;
      const totalAdminRevenueAmount =
        totalSubscriptionAmount + totalBookingAppCommissionAmount;

      const day = new Date(cursor).toISOString();

      totalSuccessTransactionsAmountChart.push({
        day,
        totalAmount: totalSuccessTransactionsAmount,
      });
      totalSubscriptionAmountChart.push({
        day,
        totalAmount: totalSubscriptionAmount,
      });
      totalBookingAppCommissionAmountChart.push({
        day,
        totalAmount: totalBookingAppCommissionAmount,
      });
      totalAdminRevenueAmountChart.push({
        day,
        totalAmount: totalAdminRevenueAmount,
      });
    }

    return {
      period: { fromDate: startDate, toDate: endDate },
      totals: {
        totalSuccessTransactionsAmount: totalSuccessTransactionsAmountChart.reduce(
          (sum, item) => sum + item.totalAmount,
          0,
        ),
        totalSubscriptionAmount: totalSubscriptionAmountChart.reduce(
          (sum, item) => sum + item.totalAmount,
          0,
        ),
        totalBookingAppCommissionAmount:
          totalBookingAppCommissionAmountChart.reduce(
            (sum, item) => sum + item.totalAmount,
            0,
          ),
        totalAdminRevenueAmount: totalAdminRevenueAmountChart.reduce(
          (sum, item) => sum + item.totalAmount,
          0,
        ),
      },
      charts: {
        totalSuccessTransactionsAmount: totalSuccessTransactionsAmountChart,
        totalSubscriptionAmount: totalSubscriptionAmountChart,
        totalBookingAppCommissionAmount: totalBookingAppCommissionAmountChart,
        totalAdminRevenueAmount: totalAdminRevenueAmountChart,
      },
    };
  }

  async adminSubscriptionAmountChart(fromDate?: string, toDate?: string) {
    const summaryChart = await this.adminPaymentSummaryChart(fromDate, toDate);

    return {
      period: summaryChart.period,
      totalAmount: summaryChart.totals.totalSubscriptionAmount,
      chart: summaryChart.charts.totalSubscriptionAmount,
    };
  }

  async adminBookingAppCommissionAmountChart(
    fromDate?: string,
    toDate?: string,
  ) {
    const summaryChart = await this.adminPaymentSummaryChart(fromDate, toDate);

    return {
      period: summaryChart.period,
      totalAmount: summaryChart.totals.totalBookingAppCommissionAmount,
      chart: summaryChart.charts.totalBookingAppCommissionAmount,
    };
  }

  async adminOfficesPaginatedSummary(
    dto: AdminNamePaginationQueryDto,
  ): Promise<
    PaginatedResponseDto<{
      officeId: number;
      officeName: string;
      logoUrl: string | null;
      offersLast7Days: number;
      totalAmountSinceJoining: number;
    }>
  > {
    const officeRepo = this.dataSource.getRepository(OfficeProfile);
    const page = Number(dto.page) > 0 ? Number(dto.page) : 1;
    const limit = Number(dto.limit) > 0 ? Number(dto.limit) : 10;
    const skip = (page - 1) * limit;
    const name = dto.name?.trim();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const baseQb = officeRepo
      .createQueryBuilder('office')
      .leftJoin('office.account', 'account')
      .leftJoin(Offer, 'offer', 'offer.office_id = office.accountId')
      .select('office.accountId', 'officeId')
      .addSelect('office.officeName', 'officeName')
      .addSelect('office.logoUrl', 'logoUrl')
      .addSelect(
        'COUNT(CASE WHEN offer."createdAt" >= :sevenDaysAgo THEN 1 END)',
        'offersLast7Days',
      )
      .addSelect(
        'COALESCE(SUM(CASE WHEN offer."createdAt" >= account."createdAt" THEN offer.price ELSE 0 END), 0)',
        'totalAmountSinceJoining',
      )
      .setParameter('sevenDaysAgo', sevenDaysAgo)
      .groupBy('office.accountId')
      .addGroupBy('office.officeName')
      .addGroupBy('office.logoUrl')
      .addGroupBy('account."createdAt"');

    if (name) {
      baseQb.andWhere('office.officeName ILIKE :name', { name: `%${name}%` });
    }

    const totalQb = officeRepo.createQueryBuilder('office');
    if (name) {
      totalQb.where('office.officeName ILIKE :name', { name: `%${name}%` });
    }

    const [rows, total] = await Promise.all([
      baseQb
        .clone()
        .orderBy(
          'COUNT(CASE WHEN offer."createdAt" >= :sevenDaysAgo THEN 1 END)',
          'DESC',
        )
        .addOrderBy('account."createdAt"', 'DESC')
        .offset(skip)
        .limit(limit)
        .getRawMany(),
      totalQb.getCount(),
    ]);

    const data = rows.map((row) => ({
      officeId: this.toNumber(row.officeId),
      officeName: row.officeName,
      logoUrl: this.resolvePublicUrl(row.logoUrl),
      offersLast7Days: this.toNumber(row.offersLast7Days),
      totalAmountSinceJoining: this.toNumber(row.totalAmountSinceJoining),
    }));

    return new PaginatedResponseDto(data, total, page, limit);
  }

  async adminUsersPaginatedPaymentSummary(
    dto: AdminNamePaginationQueryDto,
  ): Promise<
    PaginatedResponseDto<{
      userId: number;
      name: string;
      createdAt: Date;
      totalBookingsCompleted: number;
      totalAmountPaidSinceJoining: number;
    }>
  > {
    const userRepo = this.dataSource.getRepository(UserProfile);
    const page = Number(dto.page) > 0 ? Number(dto.page) : 1;
    const limit = Number(dto.limit) > 0 ? Number(dto.limit) : 10;
    const skip = (page - 1) * limit;
    const name = dto.name?.trim();

    const baseQb = userRepo
      .createQueryBuilder('user')
      .leftJoin('user.account', 'account')
      .select('user.accountId', 'userId')
      .addSelect('user.name', 'name')
      .addSelect('account."createdAt"', 'createdAt')
      .addSelect(
        (subQuery) =>
          subQuery
            .select('COUNT(*)')
            .from(Booking, 'booking')
            .where('booking."userAccountId" = user.accountId')
            .andWhere('booking.status = :completedStatus'),
        'totalBookingsCompleted',
      )
      .addSelect(
        (subQuery) =>
          subQuery
            .select('COALESCE(SUM(payment.amount), 0)')
            .from(PaymentTransaction, 'payment')
            .where('payment.payer_account_id = user.accountId')
            .andWhere('payment.status = :successStatus')
            .andWhere('payment."createdAt" >= account."createdAt"'),
        'totalAmountPaidSinceJoining',
      )
      .setParameter('completedStatus', BookingStatus.COMPLETED)
      .setParameter('successStatus', PaymentStatus.SUCCESS);

    if (name) {
      baseQb.andWhere('user.name ILIKE :name', { name: `%${name}%` });
    }

    const totalQb = userRepo.createQueryBuilder('user');
    if (name) {
      totalQb.where('user.name ILIKE :name', { name: `%${name}%` });
    }

    const [rows, total] = await Promise.all([
      baseQb
        .clone()
        .orderBy('account."createdAt"', 'DESC')
        .offset(skip)
        .limit(limit)
        .getRawMany(),
      totalQb.getCount(),
    ]);

    const data = rows.map((row) => ({
      userId: this.toNumber(row.userId),
      name: row.name,
      createdAt: new Date(row.createdAt),
      totalBookingsCompleted: this.toNumber(row.totalBookingsCompleted),
      totalAmountPaidSinceJoining: this.toNumber(row.totalAmountPaidSinceJoining),
    }));

    return new PaginatedResponseDto(data, total, page, limit);
  }


  private toNumber(value: unknown): number {
    if (typeof value === 'number') {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    }

    return 0;
  }

  private resolvePublicUrl(value: string | null | undefined): string | null {
    if (!value) {
      return null;
    }

    if (value.startsWith('http://') || value.startsWith('https://')) {
      return value;
    }

    const baseUrl = process.env.IMAGEKIT_URL_ENDPOINT || '';
    return `${baseUrl}${value}`;
  }

  private calculateMonthOverMonthPct(current: number, previous: number) {
    if (previous === 0) {
      return null;
    }

    return Number((((current - previous) * 100) / previous).toFixed(2));
  }

  private buildMonthlyDaySeries(year: number, month: number) {
    const daysInMonth = new Date(year, month, 0).getDate();
    const series = [] as Array<{ day: string; profit: number }>;

    for (let day = 1; day <= daysInMonth; day += 1) {
      series.push({
        day: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        profit: 0,
      });
    }

    return series;
  }

  private async resolveOfficeAccountId(accountId: bigint): Promise<bigint> {
    const officeProfile = await this.officeService.findByAccountId(accountId);
    if (officeProfile?.accountId) {
      return officeProfile.accountId;
    }

    const employeeMembership =
      await this.officeService.findEmployeeMembershipByAccountId(accountId);

    if (employeeMembership?.office?.accountId) {
      return employeeMembership.office.accountId;
    }

    throw new BadRequestException('Office profile not found');
  }
}
