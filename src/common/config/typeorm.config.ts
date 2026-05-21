import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  TypeOrmModuleAsyncOptions,
  TypeOrmModuleOptions,
} from '@nestjs/typeorm';

export default class TypeOrmConfig {
  static getTypeOrmConfig(configService: ConfigService): TypeOrmModuleOptions {
    const nodeEnv = configService.get<string>('NODE_ENV', 'development');
    const isProd = nodeEnv === 'production';

    // Use production or development database based on NODE_ENV
    const dbHost = isProd
      ? configService.get<string>('DB_HOST_PROD')
      : configService.get<string>('DB_HOST_DEV');
    
    const dbPort = isProd
      ? configService.get<number>('DB_PORT_PROD')
      : configService.get<number>('DB_PORT_DEV');
    
    const dbUser = isProd
      ? configService.get<string>('DB_USER_PROD')
      : configService.get<string>('DB_USER_DEV');
    
    const dbPass = isProd
      ? configService.get<string>('DB_PASS_PROD')
      : configService.get<string>('DB_PASS_DEV');
    
    const dbName = isProd
      ? configService.get<string>('DB_NAME_PROD')
      : configService.get<string>('DB_NAME_DEV');

    return {
      type: 'postgres',
      host: dbHost,
      port: dbPort,
      username: dbUser,
      password: dbPass,
      database: dbName,
      autoLoadEntities: true,
      synchronize: false,
      logging: String(configService.get<string>('TYPE_ORM_LOGGING')) === 'true',
      migrationsRun: false,
    };
  }
}

export const typeOrmConfigAsync: TypeOrmModuleAsyncOptions = {
  imports: [ConfigModule],
  useFactory: (configService: ConfigService): TypeOrmModuleOptions =>
    TypeOrmConfig.getTypeOrmConfig(configService),
  inject: [ConfigService],
};
