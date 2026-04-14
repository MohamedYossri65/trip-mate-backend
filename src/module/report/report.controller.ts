import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Auth } from 'src/common/guards/decorators/auth.decorator';
import { CurrentUser } from 'src/common/guards/decorators/user.decorator';
import { SuccessResponse } from 'src/common/interceptors/success-response.interceptor';
import { RolesEnum } from 'src/common/enums/roles.enum';
import { Account } from '../account/entity/account.entity';
import { ReportService } from './report.service';
import { OfficeReportQueryDto } from './dto/office-report-query.dto';
import { OfficeDailyProfitQueryDto } from './dto/office-daily-profit-query.dto';
import { AcceptedUsersQueryDto } from './dto/accepted-users-query.dto';
import { AdminChartQueryDto } from './dto/admin-chart-query.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { AdminNamePaginationQueryDto } from './dto/admin-name-pagination-query.dto';

@ApiTags('reports')
@Controller({ path: 'reports', version: '1' })
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('office/performance')
  @Auth()
  @ApiOperation({
    summary: 'Get office performance KPIs and chart data (accepted, rejected, interactions, and trends)',
  })
  @SuccessResponse('Office performance report retrieved successfully')
  async getOfficePerformance(
    @CurrentUser() account: Account,
    @Query() query: OfficeReportQueryDto,
  ) {
    const accountId = query.accountId ? BigInt(query.accountId) : account.id;
    return this.reportService.getOfficePerformance(
      accountId,
      query.fromDate,
      query.toDate,
    );
  }

  @Get('office/daily-profit')
  @Auth(RolesEnum.OFFICE)
  @ApiOperation({
    summary: 'Get daily profit chart data for a selected month and year',
  })
  @SuccessResponse('Office daily profit report retrieved successfully')
  async getOfficeDailyProfit(
    @CurrentUser() account: Account,
    @Query() query: OfficeDailyProfitQueryDto,
  ) {
    return this.reportService.getOfficeDailyProfit(
      account.id,
      query.month,
      query.year,
    );
  }

  @Get('admin/home-summary')
  @Auth(RolesEnum.ADMIN)
  @ApiOperation({
    summary: 'Get admin home summary KPIs for the dashboard cards',
  })
  @SuccessResponse('Admin home summary report retrieved successfully')
  async getAdminHomeSummary() {
    return this.reportService.adminHomeSummaryReport();
  }

  @Get('admin/office-performance')
  @Auth(RolesEnum.ADMIN)
  @ApiOperation({
    summary: 'Get admin office performance KPIs for the dashboard cards',
  })
  @SuccessResponse('Admin office performance report retrieved successfully')
  async getAdminOfficePerformance() {
    return this.reportService.topOffices();
  }

  @Get('admin/accepted-offers-chart')
  @Auth(RolesEnum.ADMIN)
  @ApiOperation({
    summary: 'Get accepted offers count and revenue per day, organized by month',
  })
  @SuccessResponse('Admin accepted offers chart retrieved successfully')
  async getAdminAcceptedOffersChart(@Query() query: AdminChartQueryDto) {
    return this.reportService.adminAcceptedOffersChart(
      query.fromDate,
      query.toDate,
    );
  }

  @Get('admin/new-accounts-chart')
  @Auth(RolesEnum.ADMIN)
  @ApiOperation({
    summary: 'Get new user account registrations per day in a date range',
  })
  @SuccessResponse('Admin new accounts chart retrieved successfully')
  async getAdminNewAccountsChart(@Query() query: AdminChartQueryDto) {
    return this.reportService.adminNewAccountsChart(
      query.fromDate,
      query.toDate,
    );
  }

  @Get('admin/payment-summary')
  @Auth(RolesEnum.ADMIN)
  @ApiOperation({
    summary:
      'Get payment totals from successful transactions, subscription totals, booking app commissions, and combined admin revenue',
  })
  @SuccessResponse('Admin payment summary report retrieved successfully')
  async getAdminPaymentSummary() {
    return this.reportService.adminPaymentSummaryReport();
  }

  @Get('admin/payment-summary-chart')
  @Auth(RolesEnum.ADMIN)
  @ApiOperation({
    summary:
      'Get daily chart totals for successful payments, subscriptions, booking commissions, and admin revenue in a date range',
  })
  @SuccessResponse('Admin payment summary chart retrieved successfully')
  async getAdminPaymentSummaryChart(@Query() query: AdminChartQueryDto) {
    return this.reportService.adminPaymentSummaryChart(
      query.fromDate,
      query.toDate,
    );
  }

  @Get('admin/subscription-amount-chart')
  @Auth(RolesEnum.ADMIN)
  @ApiOperation({
    summary: 'Get daily subscription amount chart in a date range',
  })
  @SuccessResponse('Admin subscription amount chart retrieved successfully')
  async getAdminSubscriptionAmountChart(@Query() query: AdminChartQueryDto) {
    return this.reportService.adminSubscriptionAmountChart(
      query.fromDate,
      query.toDate,
    );
  }

  @Get('admin/booking-app-commission-amount-chart')
  @Auth(RolesEnum.ADMIN)
  @ApiOperation({
    summary: 'Get daily booking app commission amount chart in a date range',
  })
  @SuccessResponse(
    'Admin booking app commission amount chart retrieved successfully',
  )
  async getAdminBookingAppCommissionAmountChart(
    @Query() query: AdminChartQueryDto,
  ) {
    return this.reportService.adminBookingAppCommissionAmountChart(
      query.fromDate,
      query.toDate,
    );
  }

  @Get('admin/offices-payment-summary')
  @Auth(RolesEnum.ADMIN)
  @ApiOperation({
    summary:
      'Get paginated offices summary with office name, logo, offers in last 7 days, and total amount since joining',
  })
  @SuccessResponse('Admin offices paginated summary retrieved successfully')
  async getAdminOfficesPaginatedSummary(
    @Query() query: AdminNamePaginationQueryDto,
  ) {
    return this.reportService.adminOfficesPaginatedSummary(query);
  }

  @Get('admin/users-payment-summary')
  @Auth(RolesEnum.ADMIN)
  @ApiOperation({
    summary:
      'Get paginated users summary with name, created date, completed bookings count, and total amount paid since joining',
  })
  @SuccessResponse('Admin users payment summary retrieved successfully')
  async getAdminUsersPaginatedPaymentSummary(
    @Query() query: AdminNamePaginationQueryDto,
  ) {
    return this.reportService.adminUsersPaginatedPaymentSummary(query);
  }
}
