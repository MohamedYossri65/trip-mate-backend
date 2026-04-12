import { Injectable, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BookingSetting } from './entity/booking-setting.entity';
import { BookingType } from '../domain/enum/booking-type.enum';
import { UpsertBookingSettingDto } from './dto/upsert-booking-setting.dto';
import { BookingSettingMapper } from './mapper/booking-setting.mapper';

@Injectable()
export class BookingSettingsService implements OnModuleInit {
  /** In-memory cache: BookingType → isEnabled */
  private cache = new Map<BookingType, boolean>();
  private cacheLoaded = false;

  constructor(
    @InjectRepository(BookingSetting)
    private readonly repo: Repository<BookingSetting>,
  ) {}

  /** Pre-load settings into cache when the module starts */
  async onModuleInit(): Promise<void> {
    await this.loadCache();
  }

  private async loadCache(): Promise<void> {
    const settings = await this.repo.find();
    this.cache.clear();
    for (const s of settings) {
      this.cache.set(s.serviceType, s.isEnabled);
    }
    this.cacheLoaded = true;
  }

  async findAll(): Promise<BookingSettingMapper[]> {
    const entities = await this.repo.find({ order: { serviceType: 'ASC' } });
    return BookingSettingMapper.fromEntities(entities);
  }

  async upsert(
    serviceType: BookingType,
    dto: UpsertBookingSettingDto,
  ): Promise<BookingSettingMapper> {
    if (!Object.values(BookingType).includes(serviceType)) {
      throw new BadRequestException(`Invalid service type: ${serviceType}`);
    }

    let setting = await this.repo.findOne({ where: { serviceType } });

    if (setting) {
      setting.isEnabled = dto.isEnabled;
    } else {
      setting = this.repo.create({
        serviceType,
        isEnabled: dto.isEnabled,
      });
    }

    const saved = await this.repo.save(setting);

    // Invalidate cache for this service type
    this.cache.set(serviceType, saved.isEnabled);

    return BookingSettingMapper.fromEntity(saved);
  }

  async isServiceEnabled(type: BookingType): Promise<boolean> {
    // Ensure cache is loaded
    if (!this.cacheLoaded) {
      await this.loadCache();
    }

    // If not in cache, service has no setting → enabled by default
    if (!this.cache.has(type)) return true;

    return this.cache.get(type)!;
  }
}

