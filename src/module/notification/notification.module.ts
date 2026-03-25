import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { NotificationTemplate } from './entity/notification-template.entity';
import { Notification } from './entity/notification.entity';
import { UserDevice } from './entity/user-device.entity';
import { Account } from '../account/entity/account.entity';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { NotificationListener } from './notification.listener';
import { NotificationProcessor } from './notification.processor';
import { TemplateService } from './services/template.service';
import { PushService } from './channels/push.service';
import { NotificationTemplateSeed } from './seed/notification-template.seed';
import { OfficeProfile } from '../office/entity/office.entity';
import { OfficeEmployee } from '../office/entity/employee.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      NotificationTemplate,
      Notification,
      UserDevice,
      Account,
      OfficeProfile,
      OfficeEmployee,
    ]),
    BullModule.registerQueue({
      name: 'notification-queue',
    }),
  ],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    TemplateService,
    PushService,
    NotificationListener,
    NotificationProcessor,
    NotificationTemplateSeed,
  ],
  exports: [NotificationService],
})
export class NotificationModule {}
