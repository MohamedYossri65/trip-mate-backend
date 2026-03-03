import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { UserProfile } from './entity/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

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
      name: data.name,
      account: { id: data.accountId },
    });
    return await repo.save(userProfile);
  }

  async findByAccountId(accountId: bigint): Promise<UserProfile | null> {
    return await this.userProfileRepository.findOne({
      where: { account: { id: accountId } },
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
}
