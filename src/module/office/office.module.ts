import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';
import { OfficeService } from './office.service';
import { OfficeProfile } from './entity/office.entity';
import { OfficeController } from './office.controller';
import { FileUploadModule } from 'src/common/fileUpload/file-upload.module';
import { OfficeEmployee } from './entity/employee.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([OfficeProfile , OfficeEmployee]),
    FileUploadModule,
],
  controllers: [OfficeController],
  providers: [OfficeService],
  exports: [OfficeService],
})
export class OfficeModule {}
