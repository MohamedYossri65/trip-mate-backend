import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { BannerService } from './banner.service';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { BannerFilterDto } from './dto/banner-filter.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { SuccessResponse } from 'src/common/interceptors/success-response.interceptor';
import { FileInterceptor } from '@nestjs/platform-express';
import { RolesEnum } from 'src/common/enums/roles.enum';
import { Auth } from 'src/common/guards/auth.decorator';

@ApiTags('Banners')
@Controller('banners')
export class BannerController {
  constructor(private readonly bannerService: BannerService) { }

  @Post()
  @UseInterceptors(
    FileInterceptor('imagePath', {
      limits: { files: 1 },
      fileFilter: (req, file, cb) =>
        file
          ? cb(null, true)
          : cb(new BadRequestException('File is required'), false),
    }),
  )
  @ApiOperation({ summary: 'Super Admin' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: CreateBannerDto,
  })
  @Auth(RolesEnum.ADMIN)
  @SuccessResponse('Banner created successfully', 201)
  create(
    @Body() createBannerDto: CreateBannerDto,
    @UploadedFile() imagePath: Express.Multer.File,
  ) {
    return this.bannerService.create(createBannerDto, imagePath);
  }

  @Get()
  @SuccessResponse('Banners retrieved successfully')
  findAll(@Query() filter: BannerFilterDto) {
    return this.bannerService.findAll(filter);
  }
  

  @Patch('active/:id')
  @ApiOperation({ summary: 'Toggle banner active status' })
  @Auth(RolesEnum.ADMIN)
  @SuccessResponse('Banner active status toggled successfully')
  toggleActiveStatus(@Param('id', ParseIntPipe) id: number) {
    return this.bannerService.toggleActiveStatus(id);
  }

  @Get(':id')
  @SuccessResponse('Banner retrieved successfully')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.bannerService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: UpdateBannerDto,
  })
  @Auth(RolesEnum.ADMIN)
  @SuccessResponse('Banner updated successfully')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateBannerDto: UpdateBannerDto, @UploadedFile() file: Express.Multer.File) {
    return this.bannerService.update(id, updateBannerDto, file);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Super Admin' })
  @Auth(RolesEnum.ADMIN)
  @SuccessResponse('Banner deleted successfully')
  remove(@Param('id') id: string) {
    return this.bannerService.remove(+id);
  }
}
