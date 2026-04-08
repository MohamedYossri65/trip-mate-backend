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
}
