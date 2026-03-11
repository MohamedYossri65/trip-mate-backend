import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AcceptLanguageResolver, I18nModule } from 'nestjs-i18n';
import { join } from 'path';
import { LoggerMiddleware } from './logger.middleware';
import { AccountModule } from './module/account/account.module';
import { typeOrmConfig } from './common/config/typeorm.config';
import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';
import { ConfigModule } from '@nestjs/config/dist/config.module';
import { AuthModule } from './module/auth/auth.module';
import { OfficeModule } from './module/office/office.module';
import { UserModule } from './module/user/user.module';
import { OtpModule } from './module/otp/otp.module';
import { BookingsModule } from './module/bookings/booking.module';
import { OffersModule } from './module/offers/offers.module';
import { FileUploadModule } from './module/fileUpload/file-upload.module';
import { BannerModule } from './module/banner/banner.module';
import { SubscriptionModule } from './module/subscription/subscription.module';
import { ReviewModule } from './module/review/review.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { OfficeProcessInterceptor } from './common/interceptors/office-process.interceptor';
import { SubscriptionInterceptor } from './common/interceptors/subscription.interceptor';



@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync(typeOrmConfig),
    I18nModule.forRoot({
      loaderOptions: {
        path: join(__dirname, 'i18n'),
        watch: false,
      },
      fallbackLanguage: 'ar',
      resolvers: [AcceptLanguageResolver],
    }),
    AccountModule,
    OtpModule,
    UserModule,
    OfficeModule,
    AuthModule,
    BookingsModule,
    OffersModule,
    FileUploadModule,
    BannerModule,
    SubscriptionModule,
    ReviewModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: OfficeProcessInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: SubscriptionInterceptor,
    },
  ],
})
export class AppModule {
  private nodeEnv: string;

  configure(consumer: MiddlewareConsumer) {
    this.nodeEnv = process.env.APP_ENV || 'development';
    // if (this.nodeEnv === 'development') {
    consumer.apply(LoggerMiddleware).forRoutes('*');
    // }
  }
}
