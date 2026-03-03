import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisteriationService } from './registeration.service';
import { OtpModule } from '../otp/otp.module';
import { OfficeModule } from '../office/office.module';
import { UserModule } from '../user/user.module';
import { AccountModule } from '../account/account.module';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { SessionService } from './session.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Session } from './entity/session.entity';
import { JwtStrategy } from './jwt.strategy';
import { JwtRefreshStrategy } from './jwt-refresh.strategy';

@Module({
  imports: [
    OtpModule,
    AccountModule,
    UserModule,
    OfficeModule,
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET,
      signOptions: { expiresIn: '15m' },
    }),
    TypeOrmModule.forFeature([Session]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    RegisteriationService,
    SessionService,
    JwtStrategy,
    JwtRefreshStrategy,
  ],
  exports: [AuthService],
})
export class AuthModule {}
