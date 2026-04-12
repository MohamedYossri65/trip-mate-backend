import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { BookingSettingsService } from './booking-settings.service';
import { UpsertBookingSettingDto } from './dto/upsert-booking-setting.dto';
import { Auth } from 'src/common/guards/decorators/auth.decorator';
import { RolesEnum } from 'src/common/enums/roles.enum';
import { SuccessResponse } from 'src/common/interceptors/success-response.interceptor';
import { BookingType } from '../domain/enum/booking-type.enum';

@ApiTags('booking-settings')
@Controller({ path: 'booking-settings', version: '1' })
export class BookingSettingsController {
  constructor(private readonly settingsService: BookingSettingsService) {}

  @Get()
  @Auth()
  @ApiOperation({ summary: 'List all booking service settings' })
  @SuccessResponse('Booking settings retrieved successfully')
  async findAll() {
    return this.settingsService.findAll();
  }

  @Put(':serviceType')
  @Auth(RolesEnum.ADMIN)
  @ApiOperation({ summary: 'Create or update a booking service setting (Admin only)' })
  @SuccessResponse('Booking setting updated successfully')
  async upsert(
    @Param('serviceType') serviceType: BookingType,
    @Body() dto: UpsertBookingSettingDto,
  ) {
    return this.settingsService.upsert(serviceType, dto);
  }
}
