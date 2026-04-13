import {
  Controller,
  Post,
  Patch,
  Param,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  Body,
  Get,
  Delete,
  Query,
} from '@nestjs/common';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiBody, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { OfficeService } from './office.service';
import { CommerceDetailsDto } from './dto/commerce-details.dto';
import { SuccessResponse } from 'src/common/interceptors/success-response.interceptor';
import { Auth } from 'src/common/guards/decorators/auth.decorator';
import { CurrentUser } from 'src/common/guards/decorators/user.decorator';
import { Account } from '../account/entity/account.entity';
import { RolesEnum } from 'src/common/enums/roles.enum';
import { UploadLogoDto } from './dto/upload-logo.dto';
import { AddOfficeEmployeesDto } from './dto/add-office-employees.dto';
import { InviteOfficeEmployeeDto } from './dto/add-office-employee-account.dto';
import { FileUploadService } from '../fileUpload/file-upload.service';
import { Public } from 'src/common/guards/decorators/public.decorator';
import { ChangeOfficeDataRequestDto } from './dto/chnge-office-data-request.dto';
import { RejectOfficeChangeRequestDto } from './dto/reject-office-change-request.dto';
import { UpsertOfficePaymentDetailsDto } from './dto/upsert-office-payment-details.dto';
import { AdminOfficesFilterDto } from './dto/admin-offices-filter.dto';
import { UpdateOfficeByAdminDto } from './dto/update-office-by-admin.dto';
import { CreateSupportMessageDto } from './dto/create-support-message.dto';
import { SupportMessageFilterDto } from './dto/support-message-filter.dto';

@Controller('offices')
export class OfficeController {
  constructor(
    private readonly officeService: OfficeService,
    private readonly fileUploadService: FileUploadService,
  ) { }


  @Post('admin/approve/:officeAccountId')
  @Auth(RolesEnum.ADMIN)
  @ApiOperation({ summary: 'Approve office registration (Admin)' })
  @SuccessResponse('Office registration approved successfully')
  async approveOfficeRegistration(
    @Param('officeAccountId') officeAccountId: bigint,
  ) {
    await this.officeService.approveOfficeRegistration(officeAccountId);
    return;
  }

  @Post('admin/reject/:officeAccountId')
  @Auth(RolesEnum.ADMIN)
  @ApiOperation({ summary: 'Reject office registration (Admin)' })
  @SuccessResponse('Office registration rejected successfully')
  async rejectOfficeRegistration(
    @Param('officeAccountId') officeAccountId: bigint,
    @Body() dto: RejectOfficeChangeRequestDto,
  ) {
    await this.officeService.rejectOfficeRegistration(officeAccountId, dto.reason);
    return;
  }

  @Get('admin/all')
  @Auth(RolesEnum.ADMIN)
  @ApiOperation({ summary: 'Get all offices with pagination and service type filter (Admin)' })
  @SuccessResponse('Offices retrieved successfully')
  async getAllOfficesForAdmin(@Query() query: AdminOfficesFilterDto) {
    return this.officeService.getAllOfficesForAdmin(query);
  }

  @Patch('admin/:officeAccountId')
  @Auth(RolesEnum.ADMIN)
  @ApiOperation({
    summary:
      'Update office data by admin (logo, office name, location, commerce number, account status)',
  })
  @SuccessResponse('Office data updated successfully')
  async updateOfficeByAdmin(
    @Param('officeAccountId') officeAccountId: bigint,
    @Body() dto: UpdateOfficeByAdminDto,
  ) {
    return this.officeService.updateOfficeByAdmin(officeAccountId, dto);
  }

  @Post('commerce-details')
  @Public()
  @Auth(RolesEnum.OFFICE)
  @ApiOperation({ summary: 'Add commerce details with tax certificate' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CommerceDetailsDto })
  @UseInterceptors(FileInterceptor('taxCertificate'))
  @SuccessResponse('Commerce details added successfully')
  async addCommerceDetails(
    @Body() dto: CommerceDetailsDto,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() account: Account,
  ) {
    const taxCertificateUrl = await this.fileUploadService.uploadImage(
      file,
      '/office-documents',
    );

    await this.officeService.addCommerceDetails(account.id, {
      ...dto,
      taxCertificate: taxCertificateUrl,
    });

    return;
  }

  @Post('employees')
  @Public()
  @Auth(RolesEnum.OFFICE)
  @ApiOperation({ summary: 'Add office employees' })
  @ApiBody({ type: AddOfficeEmployeesDto })
  @SuccessResponse('Employees added successfully')
  async addOfficeEmployees(
    @Body() body: AddOfficeEmployeesDto,
    @CurrentUser() account: Account,
  ) {
    await this.officeService.addOfficeEmployees(account.id, body.employees);
    return;
  }

  @Get('employees/accounts')
  @Auth(RolesEnum.OFFICE)
  @ApiOperation({ summary: 'Get all office employees' })
  @SuccessResponse('Office employees retrieved successfully')
  async getOfficeEmployees(@CurrentUser() account: Account) {
    return this.officeService.findAllEmployeesByOfficeAccountId(account.id);
  }

  @Post('employees/accounts')
  @Auth(RolesEnum.OFFICE)
  @ApiBody({ type: [InviteOfficeEmployeeDto] })
  @SuccessResponse('Employees created and OTP sent successfully')
  async AddOfficeEmployeesWithAccounts(
    @Body() employeeDtos: InviteOfficeEmployeeDto[],
    @CurrentUser() account: Account,
  ) {
    return this.officeService.AddOfficeEmployeesWithAccounts(account.id, employeeDtos);
  }

  @Delete('employees/accounts/:employeeAccountId')
  @Auth(RolesEnum.OFFICE ,RolesEnum.ADMIN)
  @SuccessResponse('Employee account removed successfully')
  async deleteEmployeeAccount(
    @Param('employeeAccountId') employeeAccountId: bigint,
    @CurrentUser() account: Account,
  ) {
    await this.officeService.deleteEmployeeAccount(account.id, employeeAccountId);
    return;
  }

  @Post('upload-logo')
  @Public()
  @Auth(RolesEnum.OFFICE ,RolesEnum.ADMIN)
  @ApiBody({ type: UploadLogoDto })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('logo'))
  @SuccessResponse('Logo uploaded successfully')
  async uploadLogo(
    @Body() dto: UploadLogoDto,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() account: Account,
  ) {
    const logoUrl = await this.fileUploadService.uploadImage(
      file,
      '/office-logos',
    );
    await this.officeService.uploadLogo(account.id, logoUrl);
    return;
  }

  @Get('office-main-data')
  @Auth(RolesEnum.OFFICE ,RolesEnum.ADMIN)
  @ApiOperation({ summary: 'Get office main data' })
  @ApiQuery({ name: 'accountId', required: false, description: 'Office account ID (Admin can specify to get any office data, Office role will ignore this and get their own data)' })
  @SuccessResponse('Office main data retrieved successfully')
  async getOfficeData(
    @CurrentUser() account: Account,
    @Query('accountId') accountId?: string,
  ) {
    const officeAcountId = account.role === RolesEnum.ADMIN && accountId ? BigInt(accountId) : account.id;
    const office = await this.officeService.getOfficeData(officeAcountId);
    return office;
  }

  @Post('payment-details')
  @Auth(RolesEnum.OFFICE)
  @ApiOperation({ summary: 'Create or update office payment details' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpsertOfficePaymentDetailsDto })
  @UseInterceptors(FileInterceptor('ibanAttachment'))
  @SuccessResponse('Office payment details saved successfully')
  async upsertOfficePaymentDetails(
    @Body() dto: UpsertOfficePaymentDetailsDto,
    @UploadedFile() ibanAttachmentFile: any,
    @CurrentUser() account: Account,
  ) {
    const ibanAttachmentUrl = ibanAttachmentFile
      ? await this.fileUploadService.uploadImage(
          ibanAttachmentFile,
          '/office-documents',
        )
      : undefined;

    return this.officeService.upsertOfficePaymentDetails(account.id, {
      ...dto,
      ibanAttachment: ibanAttachmentUrl || dto.ibanAttachment,
    });
  }

  @Get('payment-details')
  @Auth(RolesEnum.OFFICE)
  @ApiOperation({ summary: 'Get office payment details' })
  @SuccessResponse('Office payment details retrieved successfully')
  async getOfficePaymentDetails(@CurrentUser() account: Account) {
    return this.officeService.getOfficePaymentDetails(account.id);
  }

  
  @Get('details/:officeId')
  @Auth()
  @ApiOperation({ summary: 'Get office details' })
  @SuccessResponse('Office details retrieved successfully')
  async getOfficeDetails(
    @Param('officeId') officeId: string,
  ) {
    return await this.officeService.getOfficeDetails(BigInt(officeId));
  }

  @Get('my-details')
  @Auth(RolesEnum.OFFICE)
  @ApiOperation({ summary: 'Get my office details' })
  @SuccessResponse('My office details retrieved successfully')
  async getMyDetails(@CurrentUser() account: Account) {
    return await this.officeService.getOfficeDetails(account.id);
  }

  @Post('change-data-request')
  @Public()
  @Auth(RolesEnum.OFFICE)
  @ApiOperation({ summary: 'Create a request to change office data' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: ChangeOfficeDataRequestDto })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'commerceCertificate', maxCount: 1 },
      { name: 'taxCertificate', maxCount: 1 },
    ]),
  )
  @SuccessResponse('Office data change request submitted successfully')
  async addChangeOfficeDataRequest(
    @Body() dto: ChangeOfficeDataRequestDto,
    @UploadedFiles()
    files: {
      commerceCertificate?: Express.Multer.File[];
      taxCertificate?: Express.Multer.File[];
    },
    @CurrentUser() account: Account,
  ) {
    const commerceCertificateFile = files?.commerceCertificate?.[0];
    const taxCertificateFile = files?.taxCertificate?.[0];

    const commerceCertificateUrl = commerceCertificateFile
      ? await this.fileUploadService.uploadImage(
          commerceCertificateFile,
          '/office-documents',
        )
      : undefined;

    const taxCertificateUrl = taxCertificateFile
      ? await this.fileUploadService.uploadImage(
          taxCertificateFile,
          '/office-documents',
        )
      : undefined;

    return this.officeService.addChangeOfficeDataRequest(account.id, {
      ...dto,
      commerceCertificate: commerceCertificateUrl || dto.commerceCertificate,
      taxCertificate: taxCertificateUrl || dto.taxCertificate,
    });
  }

  @Get('admin/change-data-request/:officeAccountId')
  @Auth(RolesEnum.ADMIN)
  @ApiOperation({ summary: 'Get pending office data change requests (Admin)' })
  @SuccessResponse('Pending office data change requests retrieved successfully')
  async getPendingChangeOfficeDataRequests(
    @Param('officeAccountId') officeAccountId: bigint,
  ) {
    return this.officeService.getPendingChangeOfficeDataRequests(officeAccountId);
  }

  @Post('admin/change-data-requests/:officeAccountId/approve')
  @Auth(RolesEnum.ADMIN)
  @ApiOperation({ summary: 'Approve office data change request (Admin)' })
  @SuccessResponse('Office data change request approved successfully')
  async approveChangeOfficeDataRequest(
    @Param('officeAccountId') officeAccountId: bigint,
  ) {
    return this.officeService.approveChangeOfficeDataRequest(officeAccountId);
  }

  @Post('admin/change-data-requests/:officeAccountId/reject')
  @Auth(RolesEnum.ADMIN)
  @ApiOperation({ summary: 'Reject office data change request (Admin)' })
  @SuccessResponse('Office data change request rejected successfully')
  async rejectChangeOfficeDataRequest(
    @Param('officeAccountId') officeAccountId: bigint,
    @Body() dto: RejectOfficeChangeRequestDto,
  ) {
    return this.officeService.rejectChangeOfficeDataRequest(
      officeAccountId,
      dto.reason,
    );
  }

  @Delete('admin/:officeAccountId')
  @Auth(RolesEnum.ADMIN)
  @ApiOperation({ summary: 'Delete office account (Admin)' })
  @SuccessResponse('Office account deleted successfully')
  async deleteOfficeAccount(
    @Param('officeAccountId') officeAccountId: string,
  ) {
    await this.officeService.deleteOfficeAccount(BigInt(officeAccountId));
    return;
  }

  @Patch('admin/toggle-status/:accountId')
  @Auth(RolesEnum.ADMIN)
  @ApiOperation({ summary: 'Toggle office or employee account status (Admin)' })
  @SuccessResponse('Office status updated successfully')
  async toggleOfficeStatus(
    @Param('accountId') accountId: string,
  ) {
    await this.officeService.toggleStauts(BigInt(accountId));
    return;
  }

  @Post('support-messages')
  @Auth(RolesEnum.OFFICE)
  @ApiOperation({ summary: 'Create a support message from office to super admin' })
  @SuccessResponse('Support message created successfully')
  async createSupportMessage(
    @Body() dto: CreateSupportMessageDto,
    @CurrentUser() account: Account,
  ) {
    return await this.officeService.createSupportMessage(account.id, dto);
  }

  @Get('admin/support-messages')
  @Auth(RolesEnum.ADMIN)
  @ApiOperation({ summary: 'Get all support messages with pagination (Admin)' })
  @SuccessResponse('Support messages retrieved successfully')
  async getAllSupportMessages(@Query() query: SupportMessageFilterDto) {
    return await this.officeService.getAllSupportMessages(query);
  }

  @Delete('admin/support-messages/:id')
  @Auth(RolesEnum.ADMIN)
  @ApiOperation({ summary: 'Delete a support message (Admin)' })
  @SuccessResponse('Support message deleted successfully')
  async deleteSupportMessage(@Param('id') id: bigint) {
    await this.officeService.deleteSupportMessage(id);
    return;
  }
}
