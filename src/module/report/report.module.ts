import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from '../account/entity/account.entity';
import { Offer } from '../offers/entity/offer.entity';
import { OfficeModule } from '../office/office.module';
import { PaymentTransaction } from '../payment/entity/payment-transaction.entity';
import { OfficeProfile } from '../office/entity/office.entity';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Offer,
      Account,
      PaymentTransaction,
      OfficeProfile,
    ]),
    OfficeModule,
  ],
  controllers: [ReportController],
  providers: [ReportService],
  exports: [ReportService],
})
export class ReportModule {}
