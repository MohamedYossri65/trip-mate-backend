import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ReviewOfficeStatus } from './enum/review-office-status.enum';
import { OfficeProfile } from './entity/office.entity';
import { CreateOfficeDto } from './dto/create-office.dto';
import { CommerceDetailsDto } from './dto/commerce-details.dto';
import { AddEmployeeDto } from './dto/add-employee.dto';
import { InviteOfficeEmployeeDto } from './dto/add-office-employee-account.dto';
import { OfficeEmployee } from './entity/employee.entity';
import { Offer } from '../offers/entity/offer.entity';
import { OfferStatus } from '../offers/enum/offer-status.enum';
import { DataSource } from 'typeorm';
import { OfficeDetailsMapper } from './mapper/office-details.mapper';
import { SubscriptionService } from '../subscription/subscription.service';
import { ReviewService } from '../review/review.service';
import { AccountService } from '../account/account.service';
import { RolesEnum } from 'src/common/enums/roles.enum';
import { OtpService } from '../otp/otp.service';
import { OtpPurpose } from '../otp/enum/otp-purpose.enum';
import { ChangeOfficeDataRequestDto } from './dto/chnge-office-data-request.dto';

@Injectable()
export class OfficeService {
  constructor(
    @InjectRepository(OfficeProfile)
    private readonly officeProfileRepository: Repository<OfficeProfile>,

    @InjectRepository(OfficeEmployee)
    private readonly officeEmployeeRepository: Repository<OfficeEmployee>,

    private readonly dataSource: DataSource,

    private readonly accountService: AccountService,

    private readonly otpService: OtpService,

    private readonly subscriptionService: SubscriptionService,

    private readonly reviewService: ReviewService,

    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async createProfile(
    data: CreateOfficeDto,
    manager?: EntityManager,
  ): Promise<OfficeProfile> {
    const repo = manager
      ? manager.getRepository(OfficeProfile)
      : this.officeProfileRepository;
    return await repo.save(
      repo.create({
        accountId: data.accountId,
        officeName: data.officeName,
        location: data.location,
        account: { id: data.accountId },
        reviewStatus: ReviewOfficeStatus.PENDING,
      }),
    );
  }

  async findByAccountId(accountId: bigint) {
    return await this.officeProfileRepository.findOne({
      where: { account: { id: accountId } },
      relations: ['account', 'employees'],
    });
  }

  async addCommerceDetails(
    accountId: bigint,
    commerceDetails: CommerceDetailsDto,
  ) {
    await this.officeProfileRepository.update(
      { account: { id: accountId } },
      {
        commerceNumber: commerceDetails.commerceNumber,
        taxCertificate: commerceDetails.taxCertificate.toString(),
      },
    );
  }

  async addOfficeEmployees(accountId: bigint, employeeDto: AddEmployeeDto[]) {
    const office = await this.officeProfileRepository.findOne({
      where: { account: { id: accountId } },
    });
    if (!office) {
      throw new BadRequestException('Office profile not found');
    }

    const employees = employeeDto.map((emp) =>
      this.officeEmployeeRepository.create({
        office: { accountId: office.accountId },
        accountId: null,
        name: emp.name,
        phone: emp.phone,
        roleInOffice: emp.roleInOffice,
        invitedByAccountId: accountId,
      }),
    );
    await this.officeEmployeeRepository.save(employees);
  }

  async AddOfficeEmployeesWithAccounts(
    officeAccountId: bigint,
    employeeDtos: InviteOfficeEmployeeDto[],
  ): Promise<
    Array<{
      employeeId: bigint;
      accountId: bigint;
      email: string;
      phone: string;
    }>
  > {
    const office = await this.officeProfileRepository.findOne({
      where: { account: { id: officeAccountId } },
    });

    if (!office) {
      throw new BadRequestException('Office profile not found');
    }

    const invitations = await this.dataSource.transaction(async (manager) => {
      const employeeRepo = manager.getRepository(OfficeEmployee);
      const created: Array<{
        employeeId: bigint;
        accountId: bigint;
        email: string;
        phone: string;
        temporaryPassword: string;
      }> = [];

      for (const dto of employeeDtos) {
        const temporaryPassword =
          dto.temporaryPassword || '123456';

        const account = await this.accountService.create(
          {
            email: dto.email,
            phone: dto.phone,
            password: temporaryPassword,
            role: RolesEnum.OFFICE,
          },
          manager,
        );

        const employee = await employeeRepo.save(
          employeeRepo.create({
            office: { accountId: office.accountId },
            account: { id: account.id },
            accountId: account.id,
            name: dto.name,
            phone: dto.phone,
            roleInOffice: dto.roleInOffice,
            invitedByAccountId: officeAccountId,
            isActive: true,
          }),
        );

        created.push({
          employeeId: employee.id,
          accountId: account.id,
          email: dto.email,
          phone: dto.phone,
          temporaryPassword,
        });
      }

      return created;
    });

    return invitations;
  }

  async findEmployeeMembershipByAccountId(
    employeeAccountId: bigint,
  ): Promise<OfficeEmployee | null> {
    return this.officeEmployeeRepository.findOne({
      where: { accountId: employeeAccountId, isActive: true },
      relations: ['office'],
    });
  }
  
  async uploadLogo(accountId: bigint, logoUrl: string) {
    await this.officeProfileRepository.update(
      { account: { id: accountId } },
      { logoUrl },
    );
  }

  async submitForReview(accountId: bigint) {
    await this.officeProfileRepository.update(
      { account: { id: accountId } },
      { reviewStatus: ReviewOfficeStatus.PENDING },
    );
  }

  async approveOffice(accountId: bigint) {
    await this.officeProfileRepository.update(
      { account: { id: accountId } },
      { reviewStatus: ReviewOfficeStatus.APPROVED },
    );
  }

  async rejectOffice(accountId: bigint, reason: string) {
    await this.officeProfileRepository.update(
      { account: { id: accountId } },
      { reviewStatus: ReviewOfficeStatus.REJECTED, rejectionReason: reason },
    );
  }

  async getOfficeDetails(officeId : bigint): Promise<OfficeDetailsMapper> {
    const cacheKey = `office:details:${officeId.toString()}`;
    const cached = await this.cacheManager.get<OfficeDetailsMapper>(cacheKey);
    if (cached) {
      return cached;
    }

    const office = await this.officeProfileRepository.findOne({
      where: { accountId: officeId },
      relations: ['account', 'employees'],
    });

    if (!office) {
      throw new BadRequestException('Office profile not found');
    }

    const details = OfficeDetailsMapper.fromEntities(
      office,
      await this.getOfficeReviewStatus(officeId),
      await this.getOfficeCompletedBookingsPercentage(officeId),
      await this.getBookingCompletionRate(officeId),
    );

    await this.cacheManager.set(cacheKey, details, 10800000);

    return details;
  }


  async getOfficeReviewStatus(accountId: bigint): Promise<number> {
    return this.reviewService.getOfficeReviewsStats(accountId).then(stats => stats.averageRating);
  }

  async getBookingCompletionRate(officeId: bigint): Promise<number> {
    const totalOffers = await this.dataSource 
      .getRepository(Offer)      
      .createQueryBuilder('offer')
      .where('offer.office_id = :officeId', { officeId })
      .getCount();
    const completedOffers = await this.dataSource
      .getRepository(Offer)
      .createQueryBuilder('offer')
      .where('offer.office_id = :officeId', { officeId })
      .andWhere('offer.status = :status', { status: OfferStatus.ACCEPTED })
      .getCount();

    if (totalOffers === 0) return 0;
    return (completedOffers / totalOffers) * 100;
  }

  
  async getOfficeCompletedBookingsPercentage(officeId: bigint): Promise<number> {
      const totalOffers = await this.dataSource 
        .getRepository(Offer)
        .createQueryBuilder('offer')
        .where('offer.office_id = :officeId', { officeId })
        .getCount();
      
      if (totalOffers === 0) return 0;
  
      const completedOffers = await this.dataSource
        .getRepository(Offer)
        .createQueryBuilder('offer')
        .where('offer.office_id = :officeId', { officeId })
        .andWhere('offer.status = :status', { status: OfferStatus.ACCEPTED })
        .getCount();
  
      return (completedOffers / totalOffers) * 100;
    }


  async addChangeOfficeDataRequest(accountId: bigint, data: ChangeOfficeDataRequestDto) {}
}
