import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OfficeRole } from './entity/office-role.entity';
import { AdminRole } from './entity/admin-role.entity';
import { RoleService } from './role.service';
import { RoleController } from './role.controller';
import { AccountModule } from '../account/account.module';
import { OfficeModule } from '../office/office.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([OfficeRole, AdminRole]),
    AccountModule,
    OfficeModule
  ],
  controllers: [RoleController],
  providers: [RoleService],
  exports: [RoleService],
})
export class RoleModule {}
