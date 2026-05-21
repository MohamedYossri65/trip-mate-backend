import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';
import { OtpService } from './otp.service';
import { Otp } from './entity/otp.entity';
import { Account } from '../account/entity/account.entity';
import { TaqnyatSmsService } from 'src/common/services/taqnyat-sms.service';
import { AccountModule } from '../account/account.module';

@Module({
  imports: [TypeOrmModule.forFeature([Otp, Account]), AccountModule],
  controllers: [],
  providers: [OtpService, TaqnyatSmsService],
  exports: [OtpService],
})
export class OtpModule {}
