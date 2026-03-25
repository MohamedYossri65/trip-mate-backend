import {
  Controller,
  Post,
  Param,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  Body,
  Get,
  Delete,
} from '@nestjs/common';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiBody, ApiOperation } from '@nestjs/swagger';
import { OfficeService } from './office.service';
import { CommerceDetailsDto } from './dto/commerce-details.dto';
import { SuccessResponse } from 'src/common/interceptors/success-response.interceptor';
import { Auth } from 'src/common/guards/decorators/auth.decorator';
import { CurrentUser } from 'src/common/guards/decorators/user.decorator';
import { Account } from '../account/entity/account.entity';
import { RolesEnum } from 'src/common/enums/roles.enum';
import { UploadLogoDto } from './dto/upload-logo.dto';
import { AddEmployeeDto } from './dto/add-employee.dto';
import { InviteOfficeEmployeeDto } from './dto/add-office-employee-account.dto';
import { FileUploadService } from '../fileUpload/file-upload.service';
import { Public } from 'src/common/guards/decorators/public.decorator';
import { ChangeOfficeDataRequestDto } from './dto/chnge-office-data-request.dto';
import { RejectOfficeChangeRequestDto } from './dto/reject-office-change-request.dto';

@Controller('offices')
export class OfficeController {
  constructor(
    private readonly officeService: OfficeService,
    private readonly fileUploadService: FileUploadService,
  ) { }

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
  @ApiBody({ type: [AddEmployeeDto] })
  @SuccessResponse('Employees added successfully')
  async addOfficeEmployees(
    @Body() employeeDtos: AddEmployeeDto[],
    @CurrentUser() account: Account,
  ) {
    await this.officeService.addOfficeEmployees(account.id, employeeDtos);
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
  @Auth(RolesEnum.OFFICE)
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
  @Auth(RolesEnum.OFFICE)
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
}
