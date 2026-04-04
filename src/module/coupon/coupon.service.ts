import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { randomBytes } from 'crypto';
import { Coupon } from './entity/coupon.entity';
import { CouponUsage } from './entity/coupon-usage.entity';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { FilterCouponDto } from './dto/filter-coupon.dto';
import { CouponStatus } from './enum/coupon-status.enum';
import { DiscountType } from './enum/discount-type.enum';
import { Account } from '../account/entity/account.entity';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { RolesEnum } from 'src/common/enums/roles.enum';

@Injectable()
export class CouponService {
  private readonly logger = new Logger(CouponService.name);

  constructor(
    @InjectRepository(Coupon)
    private readonly couponRepo: Repository<Coupon>,

    @InjectRepository(CouponUsage)
    private readonly usageRepo: Repository<CouponUsage>,

    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
  ) {}

  // ─── CREATE ─────────────────────────────────────────────────────────

  async create(dto: CreateCouponDto): Promise<Coupon> {
    const code = await this.generateUniqueCode();

    const coupon = this.couponRepo.create({
      name: dto.name,
      code,
      target: dto.target,
      discountType: dto.discountType,
      discountValue: dto.discountValue,
      maxUsageCount: dto.maxUsageCount,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
    });

    const saved = await this.couponRepo.save(coupon);
    this.logger.log(`Coupon created: id=${saved.id}, code=${saved.code}`);
    return saved;
  }

  // ─── FIND ALL (PAGINATED + FILTERED) ───────────────────────────────

  async findAll(filter: FilterCouponDto): Promise<PaginatedResponseDto<Coupon>> {
    const where: any = {};

    if (filter.search) {
      // search by name or code (case-insensitive)
      where.name = ILike(`%${filter.search}%`);
    }

    if (filter.target) {
      where.target = filter.target;
    }

    if (filter.status) {
      where.status = filter.status;
    }

    if (filter.startDate && filter.endDate) {
      where.startDate = MoreThanOrEqual(new Date(filter.startDate));
      where.endDate = LessThanOrEqual(new Date(filter.endDate));
    } else if (filter.startDate) {
      where.startDate = MoreThanOrEqual(new Date(filter.startDate));
    } else if (filter.endDate) {
      where.endDate = LessThanOrEqual(new Date(filter.endDate));
    }

    const [data, total] = await this.couponRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: filter.skip,
      take: filter.limit,
    });

    return new PaginatedResponseDto(data, total, filter.page, filter.limit);
  }

  // ─── FIND ONE ──────────────────────────────────────────────────────

  async findOne(id: bigint): Promise<Coupon> {
    const coupon = await this.couponRepo.findOne({
      where: { id },
      relations: ['usages'],
    });
    if (!coupon) throw new NotFoundException('Coupon not found');
    return coupon;
  }

  // ─── UPDATE ────────────────────────────────────────────────────────

  async update(id: bigint, dto: UpdateCouponDto): Promise<Coupon> {
    const coupon = await this.findOne(id);

    if (dto.name !== undefined) coupon.name = dto.name;
    if (dto.target !== undefined) coupon.target = dto.target;
    if (dto.discountType !== undefined) coupon.discountType = dto.discountType;
    if (dto.discountValue !== undefined) coupon.discountValue = dto.discountValue;
    if (dto.maxUsageCount !== undefined) coupon.maxUsageCount = dto.maxUsageCount;
    if (dto.startDate !== undefined) coupon.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) coupon.endDate = new Date(dto.endDate);
    if (dto.status !== undefined) coupon.status = dto.status;

    const saved = await this.couponRepo.save(coupon);
    this.logger.log(`Coupon updated: id=${saved.id}`);
    return saved;
  }

  // ─── REMOVE (DEACTIVATE) ──────────────────────────────────────────

  async remove(id: bigint): Promise<void> {
    const coupon = await this.findOne(id);
    coupon.status = CouponStatus.INACTIVE;
    await this.couponRepo.save(coupon);
    this.logger.log(`Coupon deactivated: id=${id}`);
  }

  // ─── VALIDATE COUPON (preview, no side-effects) ───────────────────

  async validate(
    code: string,
    accountId: bigint,
    bookingId: bigint,
    originalAmount: number,
  ): Promise<{ discountAmount: number; finalAmount: number; coupon: Coupon }> {
    const coupon = await this.couponRepo.findOne({ where: { code } });
    if (!coupon) throw new NotFoundException('Coupon not found');

    await this.assertCouponEligible(coupon, accountId, bookingId);

    const discountAmount = this.calculateDiscount(coupon, originalAmount);
    const finalAmount = Math.round((originalAmount - discountAmount) * 100) / 100;

    return { discountAmount, finalAmount, coupon };
  }

  // ─── VALIDATE & APPLY (with side-effects: creates usage record) ───

  async validateAndApply(
    code: string,
    accountId: bigint,
    bookingId: bigint,
    originalAmount: number,
  ): Promise<{ discountAmount: number; finalAmount: number }> {
    const { discountAmount, finalAmount, coupon } = await this.validate(
      code,
      accountId,
      bookingId,
      originalAmount,
    );

    // Record usage
    const usage = this.usageRepo.create({
      coupon,
      account: { id: accountId } as Account,
      booking: { id: bookingId } as any,
      discountAmount,
    });
    await this.usageRepo.save(usage);

    // Increment usage counter
    coupon.currentUsageCount = Number(coupon.currentUsageCount) + 1;
    await this.couponRepo.save(coupon);

    this.logger.log(
      `Coupon applied: code=${code}, accountId=${accountId}, bookingId=${bookingId}, discount=${discountAmount}`,
    );

    return { discountAmount, finalAmount };
  }

  // ─── PRIVATE HELPERS ──────────────────────────────────────────────

  private async assertCouponEligible(
    coupon: Coupon,
    accountId: bigint,
    bookingId: bigint,
  ): Promise<void> {
    // 1. Status check
    if (coupon.status !== CouponStatus.ACTIVE) {
      throw new BadRequestException('This coupon is no longer active');
    }

    // 2. Date-range check
    const now = new Date();
    if (now < new Date(coupon.startDate)) {
      throw new BadRequestException('This coupon is not yet valid');
    }
    if (now > new Date(coupon.endDate)) {
      throw new BadRequestException('This coupon has expired');
    }

    // 3. Usage-limit check
    if (Number(coupon.currentUsageCount) >= Number(coupon.maxUsageCount)) {
      throw new BadRequestException(
        'This coupon has reached its maximum usage count',
      );
    }

    // 4. Target-role check
    const account = await this.accountRepo.findOne({
      where: { id: accountId },
    });
    if (!account) throw new NotFoundException('Account not found');

    if (
      coupon.target === 'USER' && account.role !== RolesEnum.USER
    ) {
      throw new BadRequestException('This coupon is only available for users');
    }
    if (
      coupon.target === 'OFFICE' && account.role !== RolesEnum.OFFICE
    ) {
      throw new BadRequestException('This coupon is only available for offices');
    }

    // 5. Duplicate-use check (same coupon + same booking)
    const existingUsage = await this.usageRepo.findOne({
      where: {
        coupon: { id: coupon.id },
        booking: { id: bookingId },
      },
    });
    if (existingUsage) {
      throw new BadRequestException(
        'This coupon has already been used on this booking',
      );
    }
  }

  private calculateDiscount(coupon: Coupon, originalAmount: number): number {
    let discount: number;

    if (coupon.discountType === DiscountType.PERCENTAGE) {
      discount = Math.round(originalAmount * (Number(coupon.discountValue) / 100) * 100) / 100;
    } else {
      // FIXED
      discount = Number(coupon.discountValue);
    }

    // Discount cannot exceed the original amount
    if (discount > originalAmount) {
      discount = originalAmount;
    }

    return discount;
  }

  private async generateUniqueCode(): Promise<string> {
    let code: string;
    let exists = true;

    while (exists) {
      const random = randomBytes(3).toString('hex').toUpperCase(); // 6 hex chars
      code = `TRIP-${random}`;
      const found = await this.couponRepo.findOne({ where: { code } });
      exists = !!found;
    }

    return code!;
  }
}
