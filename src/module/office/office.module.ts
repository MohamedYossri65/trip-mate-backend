import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';
import { OfficeService } from './office.service';
import { OfficeProfile } from './entity/office.entity';
import { OfficeController } from './office.controller';
import { OfficeEmployee } from './entity/employee.entity';
import { FileUploadModule } from '../fileUpload/file-upload.module';
import { SubscriptionModule } from '../subscription/subscription.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([OfficeProfile, OfficeEmployee]),
    FileUploadModule,
    SubscriptionModule,
  ],
  controllers: [OfficeController],
  providers: [OfficeService],
  exports: [OfficeService],
})
export class OfficeModule {}
