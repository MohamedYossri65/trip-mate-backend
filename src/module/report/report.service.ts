import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Account } from '../account/entity/account.entity';
import { Offer } from '../offers/entity/offer.entity';
import { OfferStatus } from '../offers/enum/offer-status.enum';
import { RolesEnum } from 'src/common/enums/roles.enum';
import { OfficeService } from '../office/office.service';

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

    const [currentAcceptedOffers, previousAcceptedOffers, currentRejectedOffers, previousRejectedOffers, currentNewCustomers, previousNewCustomers] =
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
