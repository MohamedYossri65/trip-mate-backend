import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Offer } from '../offers/entity/offer.entity';
import { OfferStatus } from '../offers/enum/offer-status.enum';
import { OfficeService } from '../office/office.service';

@Injectable()
export class ReportService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly officeService: OfficeService,
  ) {}

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
}
