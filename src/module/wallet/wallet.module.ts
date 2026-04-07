import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { OfficeWallet } from './entity/office-wallet.entity';
import { WalletTransaction } from './entity/wallet-transaction.entity';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { Account } from '../account/entity/account.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([OfficeWallet, WalletTransaction, Account]),
    ScheduleModule.forRoot(),
  ],
  controllers: [WalletController],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule {}
