import { Banner } from '../entities/banner.entity';

export class BannerMapper {
  id: number;
  imagePath: string | null;
  title: string | null;
  description: string | null;
  link: string | null;
  isActive: boolean;
  createdAt: Date;

  static fromEntity(banner: Banner): BannerMapper {
    return {
      id: banner.id,
      imagePath: banner.imagePath ?? null,
      title: banner.title ?? null,
      description: banner.description ?? null,
      link: banner.link ?? null,
      isActive: banner.isActive,
      createdAt: banner.createdAt,
    };
  }

  static fromEntities(banners: Banner[]): BannerMapper[] {
    return banners.map(BannerMapper.fromEntity);
  }
}
