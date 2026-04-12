import { BookingSetting } from '../entity/booking-setting.entity';

export class BookingSettingMapper {
  serviceType: string;
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(entity: BookingSetting): BookingSettingMapper {
    const mapper = new BookingSettingMapper();
    mapper.serviceType = entity.serviceType;
    mapper.isEnabled = entity.isEnabled;
    mapper.createdAt = entity.createdAt;
    mapper.updatedAt = entity.updatedAt;
    return mapper;
  }

  static fromEntities(entities: BookingSetting[]): BookingSettingMapper[] {
    return entities.map((e) => BookingSettingMapper.fromEntity(e));
  }
}
