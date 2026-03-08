import { Module } from '@nestjs/common';
import { BannerService } from './banner.service';
import { BannerController } from './banner.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Banner } from './entities/banner.entity';
import { FileUploadModule } from '../fileUpload/file-upload.module';

@Module({
  imports :[
    TypeOrmModule.forFeature([Banner]),
    FileUploadModule,
  ],
  controllers: [BannerController],
  providers: [BannerService],
})
export class BannerModule {}
