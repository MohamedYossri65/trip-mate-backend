import { INestApplication, Req } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AuthModule } from 'src/module/auth/auth.module';
import { BannerModule } from 'src/module/banner/banner.module';
import { BookingsModule } from 'src/module/bookings/booking.module';
import { FileUploadModule } from 'src/module/fileUpload/file-upload.module';
import { NotificationModule } from 'src/module/notification/notification.module';
import { OffersModule } from 'src/module/offers/offers.module';
import { OfficeModule } from 'src/module/office/office.module';
import { ReviewModule } from 'src/module/review/review.module';
import { SubscriptionModule } from 'src/module/subscription/subscription.module';
import { UserModule } from 'src/module/user/user.module';

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Trip mate API')
    .setDescription('Trip mate API description')
    .setVersion('2.0.0')
    .addBearerAuth()
    .addSecurityRequirements('bearer')
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    include: [
      AuthModule,
      UserModule,
      OfficeModule,
      BookingsModule,
      OffersModule,
      FileUploadModule,
      BannerModule,
      SubscriptionModule,
      ReviewModule,
      NotificationModule
    ],
  });

  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'Trip mate API Documentation',
    customCss: '.swagger-ui .topbar { display: none }',
  });
}
