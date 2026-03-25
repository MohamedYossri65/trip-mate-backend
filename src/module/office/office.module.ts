import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';
import { CacheModule } from '@nestjs/cache-manager';
import { OfficeService } from './office.service';
import { OfficeProfile } from './entity/office.entity';
import { OfficeController } from './office.controller';
import { OfficeEmployee } from './entity/employee.entity';
import { FileUploadModule } from '../fileUpload/file-upload.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { ReviewModule } from '../review/review.module';
import { AccountModule } from '../account/account.module';
import { OtpModule } from '../otp/otp.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([OfficeProfile, OfficeEmployee]),
    CacheModule.register({
      ttl: 10800000, // 3 hours in milliseconds
    }),
    FileUploadModule,
    SubscriptionModule,
    ReviewModule,
    AccountModule,
    OtpModule,
  ],
  controllers: [OfficeController],
  providers: [OfficeService],
  exports: [OfficeService],
})
export class OfficeModule {}
