import { MiddlewareConsumer, Module, OnApplicationBootstrap, OnApplicationShutdown, Logger } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AcceptLanguageResolver, I18nModule } from 'nestjs-i18n';
import { join } from 'path';
import { LoggerMiddleware } from './logger.middleware';
import { AccountModule } from './module/account/account.module';
import { typeOrmConfig } from './common/config/typeorm.config';
import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
import { RoleProcessInterceptor } from './common/interceptors/role-process.interceptor';
import { SubscriptionInterceptor } from './common/interceptors/subscription.interceptor';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BullModule } from '@nestjs/bull';
import { NotificationModule } from './module/notification/notification.module';
import { ReportModule } from './module/report/report.module';
import { ChatModule } from './module/chat/chat.module';
import { PaymentModule } from './module/payment/payment.module';
import { WalletModule } from './module/wallet/wallet.module';
import { CouponModule } from './module/coupon/coupon.module';
import { RoleModule } from './module/role/role.module';
import Redis from 'ioredis';



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
    EventEmitterModule.forRoot(),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        redis: {
          host: config.get<string>('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
        },
      }),
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
    NotificationModule,
    ReportModule,
    ChatModule,
    PaymentModule,
    WalletModule,
    CouponModule,
    RoleModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: RoleProcessInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: SubscriptionInterceptor,
    },
  ],
})
export class AppModule implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(AppModule.name);
  private nodeEnv!: string;

  constructor(private readonly configService: ConfigService) {}

  async onApplicationBootstrap(): Promise<void> {
    const redisHost = this.configService.get<string>('REDIS_HOST', 'redis');
    const redisPort = this.configService.get<number>('REDIS_PORT', 6379);

    const redis = new Redis({
      host: redisHost,
      port: redisPort,
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    });

    try {
      await redis.connect();
      await redis.ping();
      this.logger.log(`Redis connection successful: ${redisHost}:${redisPort}`);
    } catch (error: any) {
      this.logger.error(
        `Redis connection failed: ${redisHost}:${redisPort} - ${error.message}`,
      );
    } finally {
      redis.disconnect();
    }
  }

  onApplicationShutdown(): void {
    this.logger.log('Application shutdown complete');
  }

  configure(consumer: MiddlewareConsumer) {
    this.nodeEnv = process.env.APP_ENV || 'development';
    // if (this.nodeEnv === 'development') {
    consumer.apply(LoggerMiddleware).forRoutes('*');
    // }
  }
}
