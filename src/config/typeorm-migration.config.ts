import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();

// Use production or development database based on NODE_ENV
const nodeEnv = process.env.NODE_ENV || 'development';
const isProd = nodeEnv === 'production';

const dbHost = isProd ? process.env.DB_HOST_PROD : process.env.DB_HOST_DEV;
const dbPort = isProd ? process.env.DB_PORT_PROD : process.env.DB_PORT_DEV;
const dbUser = isProd ? process.env.DB_USER_PROD : process.env.DB_USER_DEV;
const dbPass = isProd ? process.env.DB_PASS_PROD : process.env.DB_PASS_DEV;
const dbName = isProd ? process.env.DB_NAME_PROD : process.env.DB_NAME_DEV;

export default new DataSource({
  type: 'postgres',
  host: dbHost,
  port: parseInt(dbPort || '5432', 10),
  username: dbUser,
  password: dbPass,
  database: dbName,
  entities: [path.join(__dirname, '..', '**', '*.entity{.ts,.js}')],
  migrations: [path.join(__dirname, '..', 'migrations', '*.{ts,js}')],
  synchronize: false,
  logging: process.env.TYPE_ORM_LOGGING === 'true',
});
