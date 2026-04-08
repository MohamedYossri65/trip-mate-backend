import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { UserProfile } from './entity/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { OfferStatus } from '../offers/enum/offer-status.enum';
import { RolesEnum } from 'src/common/enums/roles.enum';
import { UserListQueryDto } from './dto/user-list-query.dto';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserProfile)
    private readonly userProfileRepository: Repository<UserProfile>,
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

  async deleteProfile(accountId: bigint)
    : Promise<void> {
    await this.userProfileRepository.softDelete({ account: { id: accountId } });
  }

  async getAllUsersWithAcceptedOffers(query: UserListQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const search = query.search?.trim();

    const countQuery = this.userProfileRepository
      .createQueryBuilder('userProfile')
      .innerJoin('userProfile.account', 'account')
      .where('account.role = :role', { role: RolesEnum.USER });

    if (search) {
      countQuery.andWhere('userProfile.name ILIKE :search', {
        search: `%${search}%`,
      });
    }

    const total = await countQuery.getCount();

    const baseQuery = this.userProfileRepository
      .createQueryBuilder('userProfile')
      .innerJoin('userProfile.account', 'account')
      .leftJoin(
        'bookings',
        'booking',
        'booking."userAccountId" = userProfile."accountId"',
      )
      .leftJoin(
        'offers',
        'offer',
        'offer.booking_id = booking.id AND offer.status = :status',
        { status: OfferStatus.ACCEPTED },
      )
      .where('account.role = :role', { role: RolesEnum.USER });

    if (search) {
      baseQuery.andWhere('userProfile.name ILIKE :search', {
        search: `%${search}%`,
      });
    }

    const usersRaw = await baseQuery
      .select('userProfile.accountId', 'accountId')
      .addSelect('userProfile.name', 'name')
      .addSelect('account.phone', 'phone')
      .addSelect('account."createdAt"', 'createdAt')
      .addSelect('COUNT(DISTINCT offer.id)', 'acceptedOffersCount')
      .groupBy('userProfile.accountId')
      .addGroupBy('userProfile.name')
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

  
}
