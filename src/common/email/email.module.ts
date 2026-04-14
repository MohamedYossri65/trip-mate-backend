import { Module, Logger } from '@nestjs/common';
import { ServerEmailService } from './email.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env}`,
    }),
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const transport = {
          host: configService.getOrThrow<string>('SMTP_HOST'),
          port: configService.getOrThrow<number>('SMTP_PORT'),
          secure: configService.getOrThrow<boolean>('SMTP_SECURE'),
          auth: {
            user: configService.getOrThrow<string>('SMTP_USER'),
            pass: configService.getOrThrow<string>('SMTP_PASS'),
          },
        };
        return {
          transport,
          defaults: {
            from: configService.getOrThrow<string>('SMTP_FROM'),
          },
          template: {
            dir: __dirname + '/templates',
            options: { strict: true },
          },
        };
      },
    }),
  ],
  controllers: [],
  providers: [ServerEmailService],
  exports: [ServerEmailService],
})
export class ServerEmailModule {}
