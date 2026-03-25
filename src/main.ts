import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, ConsoleLogger } from '@nestjs/common';
import { setupSwagger } from './common/config/swagger-config';
import { GlobalExceptionFilter } from './common/exception/glocal-exception-filter';
import { ConfigService } from '@nestjs/config/dist/config.service';
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { getQueueToken } from '@nestjs/bull';
import { Queue } from 'bull';

// Suppress noisy startup route-mapping logs
class FilteredLogger extends ConsoleLogger {
  private readonly IGNORED_CONTEXTS = new Set(['RouterExplorer', 'RoutesResolver', 'InstanceLoader']);
  log(message: any, context?: string) {
    if (this.IGNORED_CONTEXTS.has(context ?? '')) return;
    super.log(message, context);
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: new FilteredLogger() });
  app.enableCors();

  const queue = app.get<Queue>(getQueueToken('notification-queue'));
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');

  createBullBoard({
    queues: [new BullAdapter(queue)],
    serverAdapter,
  });

  app.use('/admin/queues', serverAdapter.getRouter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const configService = app.get(ConfigService);
  app.useGlobalFilters(new GlobalExceptionFilter(configService));

  setupSwagger(app);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
