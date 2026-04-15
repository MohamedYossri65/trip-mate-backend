import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OfficeRole } from './entity/office-role.entity';
import { AdminRole } from './entity/admin-role.entity';
import { CreateRoleDto } from './dto/create-office-role.dto';
import { UpdateRoleDto } from './dto/update-office-role.dto';
import { CreateAdminRoleDto } from './dto/create-admin-role.dto';
import { UpdateAdminRoleDto } from './dto/update-admin-role.dto';
import { OfficeService } from '../office/office.service';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(OfficeRole)
    private readonly officeRoleRepository: Repository<OfficeRole>,

    @InjectRepository(AdminRole)
    private readonly adminRoleRepository: Repository<AdminRole>,

    private readonly officeService: OfficeService,
  ) { }

  async createOfficeRole(dto: CreateRoleDto, accountId: bigint): Promise<OfficeRole> {
    const exists = await this.officeRoleRepository.findOne({
      where: { name: dto.name },
    });
    if (exists) {
      throw new BadRequestException(`Role with name "${dto.name}" already exists`);
    }

    const employeeMembership = await this.officeService.findEmployeeMembershipByAccountId(accountId);
    const officeAccountId = employeeMembership ? employeeMembership.office.accountId : accountId;

    const role = this.officeRoleRepository.create({
      name: dto.name,
      permissions: dto.permissions,
      createdBy: officeAccountId,
    });

    return this.officeRoleRepository.save(role);
  }

  async findOfficeRoles(accountId: bigint): Promise<OfficeRole[]> {
    const employeeMembership = await this.officeService.findEmployeeMembershipByAccountId(accountId);
    const officeAccountId = employeeMembership ? employeeMembership.office.accountId : accountId;
    return this.officeRoleRepository.find({ where: { createdBy: officeAccountId }, order: { createdAt: 'DESC' } });
  }

  async findById(id: bigint): Promise<OfficeRole | null> {
    return this.officeRoleRepository.findOne({ where: { id } });
  }

  async findActiveById(id: bigint): Promise<OfficeRole | null> {
    return this.officeRoleRepository.findOne({ where: { id, isActive: true } });
  }

  async update(id: bigint, dto: UpdateRoleDto): Promise<OfficeRole> {
    const role = await this.findById(id);
    if (!role) {
      throw new BadRequestException('Role not found');
    }

    if (dto.name !== undefined) {
      role.name = dto.name;
    }

    if (dto.permissions !== undefined) {
      role.permissions = { ...role.permissions, ...dto.permissions };
    }

    if (dto.isActive !== undefined) {
      role.isActive = dto.isActive;
    }

    return this.officeRoleRepository.save(role);
  }

  async delete(id: bigint): Promise<void> {
    const role = await this.findById(id);
    if (!role) {
      throw new BadRequestException('Role not found');
    }
    if (!role.isActive) {
      return;
    }
    await this.officeRoleRepository.update({ id }, { isActive: false });
  }

  async createAdminRole(dto: CreateAdminRoleDto, accountId: bigint): Promise<AdminRole> {
    const exists = await this.adminRoleRepository.findOne({
      where: { name: dto.name },
    });
    if (exists) {
      throw new BadRequestException(`Role with name "${dto.name}" already exists`);
    }

    const role = this.adminRoleRepository.create({
      name: dto.name,
      permissions: dto.permissions,
      createdBy: accountId,
    });

    return this.adminRoleRepository.save(role);
  }

  async findAdminById(id: bigint): Promise<AdminRole | null> {
    return this.adminRoleRepository.findOne({ where: { id } });
  }

  async findAdminRoles(): Promise<AdminRole[]> {
    return this.adminRoleRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async updateAdminRole(id: bigint, dto: UpdateAdminRoleDto): Promise<AdminRole> {
    const role = await this.findAdminById(id);
    if (!role) {
      throw new BadRequestException('Role not found');
    }

    if (dto.name !== undefined) {
      role.name = dto.name;
    }

    if (dto.permissions !== undefined) {
      role.permissions = { ...role.permissions, ...dto.permissions };
    }

    if (dto.isActive !== undefined) {
      role.isActive = dto.isActive;
    }

    return this.adminRoleRepository.save(role);
  }

  async deleteAdminRole(id: bigint): Promise<void> {
    const role = await this.findAdminById(id);
    if (!role) {
      throw new BadRequestException('Role not found');
    }
    if (!role.isActive) {
      return;
    }
    await this.adminRoleRepository.update({ id }, { isActive: false });
  }
}
