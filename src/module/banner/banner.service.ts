import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Banner } from './entities/banner.entity';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { FileUploadService } from '../fileUpload/file-upload.service';
import { BannerFilterDto } from './dto/banner-filter.dto';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { BannerMapper } from './mapper/banner.mapper';


@Injectable()
export class BannerService {
  private readonly logger = new Logger(BannerService.name);

  constructor(
    @InjectRepository(Banner)
    private bannerRepository: Repository<Banner>,
    private readonly fileUploadService: FileUploadService,
  ) { }

  async create(createBannerDto: CreateBannerDto, file?: Express.Multer.File): Promise<BannerMapper> {
    let imagePath = '';
    if (file) {
      imagePath = await this.fileUploadService.uploadImage(file, 'banner', 100);
    }
    const banner = this.bannerRepository.create({ ...createBannerDto, imagePath });
    const savedBanner = await this.bannerRepository.save(banner);
    return BannerMapper.fromEntity(savedBanner);
  }

  async findAll(filter: BannerFilterDto): Promise<PaginatedResponseDto<BannerMapper>> {
    const { page, limit, skip, name , isActive} = filter;

    const [banners, total] = await this.bannerRepository.findAndCount({
      where: {
        title: name ? ILike(`%${name}%`) : undefined,
        isActive: isActive !== undefined ? isActive : undefined
      },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return new PaginatedResponseDto(BannerMapper.fromEntities(banners), total, page, limit);
  }

  async findOne(id: number): Promise<BannerMapper> {
    const banner = await this.bannerRepository.findOne({ where: { id } });
    if (!banner) {
      throw new NotFoundException('Banner not found');
    }
    return BannerMapper.fromEntity(banner);
  }

  async update(id: number, updateBannerDto: UpdateBannerDto, file?: Express.Multer.File): Promise<BannerMapper> {
    const existing = await this.findOne(id);
    if (file) {
      updateBannerDto.imagePath = await this.fileUploadService.uploadImage(file, 'banner', 100);
    }else{
      updateBannerDto.imagePath = existing.imagePath ?? undefined;
    }
    await this.bannerRepository.update(id, {
      ...updateBannerDto,
      imagePath: updateBannerDto.imagePath,
    });
    const updated = await this.bannerRepository.findOne({ where: { id } });
    return BannerMapper.fromEntity(updated!);
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.bannerRepository.softDelete(id);
  }

  async toggleActiveStatus(id: number): Promise<BannerMapper> {
    const banner = await this.bannerRepository.findOne({ where: { id } });
    if (!banner) throw new NotFoundException('Banner not found');
    banner.isActive = !banner.isActive;
    const updated = await this.bannerRepository.save(banner);
    return BannerMapper.fromEntity(updated);
  }
}