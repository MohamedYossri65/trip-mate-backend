import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CouponService } from './coupon.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { FilterCouponDto } from './dto/filter-coupon.dto';
import { Auth } from 'src/common/guards/decorators/auth.decorator';
import { RolesEnum } from 'src/common/enums/roles.enum';
import { SuccessResponse } from 'src/common/interceptors/success-response.interceptor';
import { CurrentUser } from 'src/common/guards/decorators/user.decorator';
import { Account } from '../account/entity/account.entity';

@ApiTags('coupons')
@Controller({ path: 'coupons', version: '1' })
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  // ─── ADMIN: Create Coupon ─────────────────────────────────────────

  @Post()
  @Auth(RolesEnum.ADMIN)
  @ApiOperation({ summary: 'Create a new coupon (Admin only)' })
  @SuccessResponse('Coupon created successfully')
  async create(@Body() dto: CreateCouponDto) {
    return this.couponService.create(dto);
  }

  // ─── ADMIN: List Coupons ──────────────────────────────────────────

  @Get()
  @Auth(RolesEnum.ADMIN)
  @ApiOperation({ summary: 'List all coupons with filters (Admin only)' })
  @SuccessResponse('Coupons retrieved successfully')
  async findAll(@Query() filter: FilterCouponDto) {
    return this.couponService.findAll(filter);
  }

  // ─── ADMIN: Get Single Coupon ─────────────────────────────────────

  @Get(':id')
  @Auth(RolesEnum.ADMIN)
  @ApiOperation({ summary: 'Get coupon details (Admin only)' })
  @SuccessResponse('Coupon retrieved successfully')
  async findOne(@Param('id') id: string) {
    return this.couponService.findOne(BigInt(id));
  }

  // ─── ADMIN: Update Coupon ─────────────────────────────────────────

  @Patch(':id')
  @Auth(RolesEnum.ADMIN)
  @ApiOperation({ summary: 'Update coupon (Admin only)' })
  @SuccessResponse('Coupon updated successfully')
  async update(@Param('id') id: string, @Body() dto: UpdateCouponDto) {
    return this.couponService.update(BigInt(id), dto);
  }

  // ─── ADMIN: Delete (Deactivate) Coupon ────────────────────────────

  @Delete(':id')
  @Auth(RolesEnum.ADMIN)
  @ApiOperation({ summary: 'Deactivate coupon (Admin only)' })
  @SuccessResponse('Coupon deactivated successfully')
  async remove(@Param('id') id: string) {
    return this.couponService.remove(BigInt(id));
  }

  // ─── USER: Validate Coupon Code (preview) ─────────────────────────

  @Post('validate')
  @Auth(RolesEnum.USER)
  @ApiOperation({
    summary: 'Validate a coupon code and preview discount (User only)',
  })
  @SuccessResponse('Coupon is valid')
  async validateCoupon(
    @Body() body: { couponCode: string; bookingId: number; amount: number },
    @CurrentUser() account: Account,
  ) {
    const { discountAmount, finalAmount } = await this.couponService.validate(
      body.couponCode,
      account.id,
      BigInt(body.bookingId),
      body.amount,
    );
    return { discountAmount, finalAmount };
  }
}
