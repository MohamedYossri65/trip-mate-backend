import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';
import { OtpService } from './otp.service';
import { Otp } from './entity/otp.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Otp])],
  controllers: [],
  providers: [OtpService],
  exports: [OtpService],
})
export class OtpModule {}
