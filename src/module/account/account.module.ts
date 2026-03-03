import { Module } from '@nestjs/common';
import { Account } from './entity/account.entity';
import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';
import { AccountService } from './account.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Account]),
    ],
    controllers: [],
    providers: [
        AccountService,
    ],
    exports: [
        AccountService,
    ],
})
export class AccountModule { }
