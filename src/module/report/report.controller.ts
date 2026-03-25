import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Auth } from 'src/common/guards/decorators/auth.decorator';
import { CurrentUser } from 'src/common/guards/decorators/user.decorator';
import { SuccessResponse } from 'src/common/interceptors/success-response.interceptor';
import { RolesEnum } from 'src/common/enums/roles.enum';
import { Account } from '../account/entity/account.entity';
import { ReportService } from './report.service';
import { OfficeReportQueryDto } from './dto/office-report-query.dto';

@ApiTags('reports')
@Controller({ path: 'reports', version: '1' })
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('office/performance')
  @Auth(RolesEnum.OFFICE)
  @ApiOperation({
    summary: 'Get office performance KPIs and chart data (accepted, rejected, interactions, and trends)',
  })
  @SuccessResponse('Office performance report retrieved successfully')
  async getOfficePerformance(
    @CurrentUser() account: Account,
    @Query() query: OfficeReportQueryDto,
  ) {
    return this.reportService.getOfficePerformance(
      account.id,
      query.fromDate,
      query.toDate,
    );
  }
}
