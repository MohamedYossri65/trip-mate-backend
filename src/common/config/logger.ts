import { ElasticsearchTransport } from 'winston-elasticsearch';
import * as winston from 'winston';
import * as path from 'path';
import * as fs from 'fs';
import 'winston-daily-rotate-file';

const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const esTransportOpts = {
  level: 'info',
  clientOpts: {
    node: 'http://elasticsearch:9200',
    requestTimeout: 10000,
  },
  indexPrefix: 'trip-mate-logs',
  buffering: false,
  flushInterval: 2000,
};

const esErrorTransportOpts = {
  level: 'error',
  clientOpts: {
    node: 'http://elasticsearch:9200',
    requestTimeout: 10000,
  },
  indexPrefix: 'trip-mate-errors',  // separate index for errors
  buffering: false,
  flushInterval: 2000,
};

const esTransport = new ElasticsearchTransport(esTransportOpts);
const esErrorTransport = new ElasticsearchTransport(esErrorTransportOpts);

// Surface Elasticsearch transport errors so they appear in the console/file logs
esTransport.on('error', (error: Error) => {
  console.error('[winston-elasticsearch] Transport error:', error.message);
});

esErrorTransport.on('error', (error: Error) => {
  console.error('[winston-elasticsearch] Error transport error:', error.message);
});

const dailyRotateApp = new winston.transports.DailyRotateFile({
  dirname: logDir,
  filename: 'app-%DATE%.log',   // e.g. app-2026-03-06.log
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,           // gzip old files
  maxSize: '20m',                // rotate if a single file hits 20 MB mid-day
  maxFiles: '14d',               // keep last 14 days, delete older
  level: 'info',
});

const dailyRotateError = new winston.transports.DailyRotateFile({
  dirname: logDir,
  filename: 'errors-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '30d',               // keep errors longer (30 days)
  level: 'error',
});

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    esTransport,
    new winston.transports.Console(),
    dailyRotateApp,
    dailyRotateError,
  ]
});

export const errorLogger = winston.createLogger({
  level: 'error',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    esErrorTransport,
    dailyRotateError,
    new winston.transports.Console(),
  ]
});
