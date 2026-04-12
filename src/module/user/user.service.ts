import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { UserProfile } from './entity/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { OfferStatus } from '../offers/enum/offer-status.enum';
import { RolesEnum } from 'src/common/enums/roles.enum';
import { UserListQueryDto } from './dto/user-list-query.dto';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { AccountService } from '../account/account.service';
import { AccountStatus } from 'src/common/enums/account-status.enum';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserProfile)
    private readonly userProfileRepository: Repository<UserProfile>,

    private accountService: AccountService
  ) { }

  async createProfile(
    data: CreateUserDto,
    manager?: EntityManager,
  ): Promise<UserProfile> {
    const repo = manager
      ? manager.getRepository(UserProfile)
      : this.userProfileRepository;
    const userProfile = repo.create({
      accountId: data.accountId,
      name: data.name,
      account: { id: data.accountId },
    });
    return await repo.save(userProfile);
  }

  async findByAccountId(accountId: bigint): Promise<UserProfile | null> {
    return await this.userProfileRepository.findOne({
      where: { accountId },
      relations: ['account'],
    });
  }

  async updateName(accountId: bigint, newName: string): Promise<string> {
    await this.userProfileRepository.update(
      { account: { id: accountId } },
      { name: newName },
    );
    return newName;
  }

  async updateProfile(
    accountId: bigint,
    dto: UpdateUserDto,
  ): Promise<UserProfile> {
    const user = await this.findByAccountId(accountId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update UserProfile fields
    if (dto.name) {
      user.name = dto.name;
    }

    // Update Account fields
    const accountUpdates: any = {};
    if (dto.email !== undefined) {
      accountUpdates.email = dto.email;
    }
    if (dto.phone !== undefined) {
      accountUpdates.phone = dto.phone;
    }
    if (dto.status !== undefined) {
      accountUpdates.status = dto.status;
    }

    // Save both updates
    if (Object.keys(accountUpdates).length > 0) {
      await this.userProfileRepository
        .createQueryBuilder()
        .update()
        .set(user)
        .where('accountId = :accountId', { accountId })
        .execute();

      await this.userProfileRepository.manager
        .getRepository('Account')
        .update({ id: accountId }, accountUpdates);
    } else {
      await this.userProfileRepository.save(user);
    }

    // Reload updated user
    const updatedUser = await this.findByAccountId(accountId);
    if (!updatedUser) {
      throw new NotFoundException('User not found after update');
    }
    return updatedUser;
  }

  async deleteProfile(accountId: bigint)
    : Promise<void> {
    await this.userProfileRepository.softDelete({ account: { id: accountId } });
    await this.accountService.softDelete(accountId);
  }

  async getAllUsersWithAcceptedOffers(query: UserListQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const search = query.search?.trim();

    const countQuery = this.userProfileRepository
      .createQueryBuilder('user_profile')
      .innerJoin('user_profile.account', 'account')
      .where('account.role = :role', { role: RolesEnum.USER });

    if (search) {
      countQuery.andWhere('user_profile.name ILIKE :search', {
        search: `%${search}%`,
      });
    }

    const total = await countQuery.getCount();

    const baseQuery = this.userProfileRepository
      .createQueryBuilder('user_profile')
      .innerJoin('user_profile.account', 'account')
      .leftJoin(
        'bookings',
        'booking',
        'booking."userAccountId" = user_profile.account_id',
      )
      .leftJoin(
        'offers',
        'offer',
        'offer.booking_id = booking.id AND offer.status = :status',
        { status: OfferStatus.ACCEPTED },
      )
      .where('account.role = :role', { role: RolesEnum.USER });

    if (search) {
      baseQuery.andWhere('user_profile.name ILIKE :search', {
        search: `%${search}%`,
      });
    }

    const usersRaw = await baseQuery
      .select('user_profile.account_id', 'accountId')
      .addSelect('user_profile.name', 'name')
      .addSelect('account.phone', 'phone')
      .addSelect('account."createdAt"', 'createdAt')
      .addSelect('COUNT(DISTINCT offer.id)', 'acceptedOffersCount')
      .groupBy('user_profile.account_id')
      .addGroupBy('user_profile.name')
      .addGroupBy('account.phone')
      .addGroupBy('account."createdAt"')
      .orderBy('account."createdAt"', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getRawMany();

    return new PaginatedResponseDto(
      usersRaw.map((row) => ({
        accountId: String(row.accountId),
        name: row.name,
        phone: row.phone,
        createdAt: row.createdAt,
        acceptedOffersCount: Number(row.acceptedOffersCount) || 0,
      })),
      total,
      page,
      limit,
    );
  }

  async findOne(accountId: bigint){
    const user = await this.userProfileRepository.findOne({
      where: { accountId },
      relations: ['account'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return {
      accountId: user.accountId,
      name: user.name,
      account: {
        email: user.account.email,
        phone: user.account.phone,
        status: user.account.status,
      },
      createdAt: user.account.createdAt,
    };
  }


  async ToggleStatus(accountId: bigint){
  const user = await this.findByAccountId(accountId);
  if (!user) {
    throw new NotFoundException("this user not found");
  }
  if (user.account.status === AccountStatus.ACTIVE) {
    await this.accountService.updateStatus(accountId, AccountStatus.BLOCKED)
  } else {
    await this.accountService.updateStatus(accountId, AccountStatus.ACTIVE)
  }
}

  
}
