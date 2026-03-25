import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, IsNull, Not, Repository } from 'typeorm';
import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { EventEmitter2 } from '@nestjs/event-emitter';
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
import { Account } from '../account/entity/account.entity';
import { OfficeChangeRequestData } from './entity/office.entity';
import { OfficeChangeRequestEvent } from '../notification/events';

@Injectable()
export class OfficeService {
  constructor(
    @InjectRepository(OfficeProfile)
    private readonly officeProfileRepository: Repository<OfficeProfile>,

    @InjectRepository(OfficeEmployee)
    private readonly officeEmployeeRepository: Repository<OfficeEmployee>,

    private readonly dataSource: DataSource,

    private readonly accountService: AccountService,

    private readonly reviewService: ReviewService,

    private readonly eventEmitter: EventEmitter2,

    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) { }

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

  async deleteEmployeeAccount(adminAccountId: bigint, employeeAccountId: bigint) {
    const employee = await this.officeEmployeeRepository.findOne({
      where: { accountId: employeeAccountId },
    });
    if (!employee || employee.invitedByAccountId !== adminAccountId) {
      throw new BadRequestException('Employee not found');
    }
    await this.accountService.softDelete(employeeAccountId);
    await this.officeEmployeeRepository.softDelete({ accountId: employeeAccountId });
  }

  async findAllEmployeesByOfficeAccountId(
    officeAccountId: bigint,
  ): Promise<OfficeEmployee[]> {
    return this.officeEmployeeRepository.find({
      where: {
        office: { accountId: officeAccountId },
        accountId: Not(IsNull()),
        isActive: true,
      },
      relations: ['account'],
    });
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

  async getOfficeDetails(officeId: bigint): Promise<OfficeDetailsMapper> {
    let resolvedOfficeId = officeId;

    let office = await this.officeProfileRepository.findOne({
      where: { accountId: resolvedOfficeId },
      relations: ['account', 'employees'],
    });

    if (!office) {
      const employeeMembership = await this.findEmployeeMembershipByAccountId(officeId);
      if (employeeMembership?.office?.accountId) {
        resolvedOfficeId = employeeMembership.office.accountId;
        office = await this.officeProfileRepository.findOne({
          where: { accountId: resolvedOfficeId },
          relations: ['account', 'employees'],
        });
      }
    }

    if (!office) {
      throw new BadRequestException('Office profile not found');
    }

    const cacheKey = `office:details:${resolvedOfficeId.toString()}`;
    const cached = await this.cacheManager.get<OfficeDetailsMapper>(cacheKey);
    if (cached) {
      return cached;
    }

    const details = OfficeDetailsMapper.fromEntities(
      office,
      await this.getOfficeReviewStatus(resolvedOfficeId),
      await this.getOfficeCompletedBookingsPercentage(resolvedOfficeId),
      await this.getBookingCompletionRate(resolvedOfficeId),
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


  async addChangeOfficeDataRequest(accountId: bigint, data: ChangeOfficeDataRequestDto) {
    const office = await this.officeProfileRepository.findOne({
      where: { accountId },
    });

    if (!office) {
      throw new BadRequestException('Office profile not found');
    }

    const requestData: OfficeChangeRequestData = {
      officeName: data.officeName,
      phoneNumber: data.phoneNumber,
      email: data.email,
      commerceNumber: data.commerceNumber,
      commerceCertificate: data.commerceCertificate?.toString(),
      taxCertificate: data.taxCertificate?.toString(),
    };

    await this.officeProfileRepository.update(
      { accountId },
      {
        changeRequestStatus: ReviewOfficeStatus.PENDING,
        changeRequestData: requestData,
        changeRequestRejectionReason: '',
        changeRequestSubmittedAt: new Date(),
      },
    );

    // Emit event for notification system
    this.eventEmitter.emit(
      'office.change_request',
      new OfficeChangeRequestEvent(accountId, data.officeName),
    );

    return {
      officeAccountId: accountId,
      changeRequestStatus: ReviewOfficeStatus.PENDING,
    };
  }


  async getPendingChangeOfficeDataRequests(officeAccountId: bigint) {
    const whereCondition: any = { changeRequestStatus: ReviewOfficeStatus.PENDING };

    if (officeAccountId !== undefined) {
      whereCondition.accountId = officeAccountId;
    }

    return this.officeProfileRepository.find({
      where: {
        accountId: officeAccountId,
        changeRequestStatus: ReviewOfficeStatus.PENDING
      },
      relations: ['account'],
      order: { changeRequestSubmittedAt: 'DESC' },
    });
  }

  async approveChangeOfficeDataRequest(officeAccountId: bigint) {
    await this.dataSource.transaction(async (manager) => {
      const officeRepo = manager.getRepository(OfficeProfile);
      const accountRepo = manager.getRepository(Account);

      const office = await officeRepo.findOne({
        where: { accountId: officeAccountId },
        relations: ['account'],
      });

      if (!office) {
        throw new BadRequestException('Office profile not found');
      }

      if (
        office.changeRequestStatus !== ReviewOfficeStatus.PENDING ||
        !office.changeRequestData
      ) {
        throw new BadRequestException('No pending change request found for this office');
      }

      const requestData = office.changeRequestData;

      if (requestData.email && requestData.email !== office.account?.email) {
        const existingEmail = await accountRepo.findOne({
          where: { email: requestData.email },
        });

        if (existingEmail && existingEmail.id !== office.accountId) {
          throw new BadRequestException('Email already registered');
        }
      }

      if (requestData.phoneNumber && requestData.phoneNumber !== office.account?.phone) {
        const existingPhone = await accountRepo.findOne({
          where: { phone: requestData.phoneNumber },
        });

        if (existingPhone && existingPhone.id !== office.accountId) {
          throw new BadRequestException('Phone number already registered');
        }
      }

      const accountUpdates: Partial<Account> = {};
      if (requestData.email) {
        accountUpdates.email = requestData.email;
      }
      if (requestData.phoneNumber) {
        accountUpdates.phone = requestData.phoneNumber;
      }

      if (Object.keys(accountUpdates).length > 0) {
        await accountRepo.update({ id: office.accountId }, accountUpdates);
      }

      await officeRepo.update(
        { accountId: officeAccountId },
        {
          officeName: requestData.officeName || office.officeName,
          commerceNumber: requestData.commerceNumber || office.commerceNumber,
          taxCertificate: requestData.taxCertificate || office.taxCertificate,
          changeRequestStatus: ReviewOfficeStatus.APPROVED,
          changeRequestData: null,
          changeRequestRejectionReason: '',
        },
      );
    });

    await this.cacheManager.del(`office:details:${officeAccountId.toString()}`);

    return {
      officeAccountId,
      changeRequestStatus: ReviewOfficeStatus.APPROVED,
    };
  }

  async rejectChangeOfficeDataRequest(officeAccountId: bigint, reason: string) {
    const office = await this.officeProfileRepository.findOne({
      where: { accountId: officeAccountId },
    });

    if (!office) {
      throw new BadRequestException('Office profile not found');
    }

    if (office.changeRequestStatus !== ReviewOfficeStatus.PENDING) {
      throw new BadRequestException('No pending change request found for this office');
    }

    await this.officeProfileRepository.update(
      { accountId: officeAccountId },
      {
        changeRequestStatus: ReviewOfficeStatus.REJECTED,
        changeRequestRejectionReason: reason,
      },
    );

    return {
      officeAccountId,
      changeRequestStatus: ReviewOfficeStatus.REJECTED,
    };
  }
}
