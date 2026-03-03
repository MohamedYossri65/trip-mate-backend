import {
  Controller,
  Post,
  Param,
  UploadedFile,
  UseInterceptors,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiBody, ApiOperation } from '@nestjs/swagger';
import { OfficeService } from './office.service';
import { CommerceDetailsDto } from './dto/commerce-details.dto';
import { FileUploadService } from 'src/common/fileUpload/file-upload.service';
import { SuccessResponse } from 'src/common/interceptors/success-response.interceptor';
import { Auth } from 'src/common/guards/auth.decorator';
import { CurrentUser } from 'src/common/guards/user.decorator';
import { Account } from '../account/entity/account.entity';
import { RolesEnum } from 'src/common/enums/roles.enum';
import { UploadLogoDto } from './dto/upload-logo.dto';
import { AddEmployeeDto } from './dto/add-employee.dto';

@Controller('offices')
export class OfficeController {
  constructor(
    private readonly officeService: OfficeService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  @Post('commerce-details')
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

  @Post('upload-logo')
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
}
