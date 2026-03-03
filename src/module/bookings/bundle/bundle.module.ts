import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';
import { Bundle } from '../domain/entity/bundle.entity';
import { BundleService } from './bundle.service';
import { BundleRepository } from './repository/bundle.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Bundle])],
  providers: [BundleService, BundleRepository],
  exports: [BundleService, BundleRepository],
})
export class BundleModule {}
