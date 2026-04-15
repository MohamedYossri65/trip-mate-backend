import { Module } from '@nestjs/common';
import { Account } from './entity/account.entity';
import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';
import { AccountService } from './account.service';
import { OfficeRole } from '../role/entity/office-role.entity';
import { AdminRole } from '../role/entity/admin-role.entity';
import { AdminProfile } from './entity/admin.profile.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Account, OfficeRole, AdminRole ,AdminProfile]),
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
