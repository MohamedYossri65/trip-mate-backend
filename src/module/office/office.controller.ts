import {
  Controller,
  Post,
  Param,
  UploadedFile,
  UseInterceptors,
  Body,
  Get,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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

  @Post('employees/accounts')
  @Public()
  @Auth(RolesEnum.OFFICE)
  @ApiOperation({ summary: 'add office employees with login accounts' })
  @ApiBody({ type: [InviteOfficeEmployeeDto] })
  @SuccessResponse('Employees created and OTP sent successfully')
  async AddOfficeEmployeesWithAccounts(
    @Body() employeeDtos: InviteOfficeEmployeeDto[],
    @CurrentUser() account: Account,
  ) {
    return this.officeService.AddOfficeEmployeesWithAccounts(account.id, employeeDtos);
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
}
