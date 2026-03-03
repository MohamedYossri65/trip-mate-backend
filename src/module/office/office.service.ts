import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { ReviewOfficeStatus } from './enum/review-office-status.enum';
import { OfficeProfile } from './entity/office.entity';
import { CreateOfficeDto } from './dto/create-office.dto';
import { CommerceDetailsDto } from './dto/commerce-details.dto';
import { AddEmployeeDto } from './dto/add-employee.dto';
import { OfficeEmployee } from './entity/employee.entity';

@Injectable()
export class OfficeService {
  constructor(
    @InjectRepository(OfficeProfile)
    private readonly officeProfileRepository: Repository<OfficeProfile>,

    @InjectRepository(OfficeEmployee)
    private readonly officeEmployeeRepository: Repository<OfficeEmployee>,
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
        officeName: data.officeName,
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
        office: { id: office.id },
        name: emp.name,
        phone: emp.phone,
        roleInOffice: emp.roleInOffice,
      }),
    );
    await this.officeEmployeeRepository.save(employees);
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
}
