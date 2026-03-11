import { ElasticsearchTransport } from 'winston-elasticsearch';
import * as winston from 'winston';
import * as path from 'path';
import * as fs from 'fs';
import 'winston-daily-rotate-file';

const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Transformer to sanitize data before sending to Elasticsearch
const sanitizeForElasticsearch = (logData: any) => {
  const sanitize = (obj: any): any => {
    if (obj === null || obj === undefined) return obj;
    
    if (Array.isArray(obj)) {
      // Convert arrays with mixed types to JSON strings
      return JSON.stringify(obj);
    }
    
    if (typeof obj === 'object' && obj.constructor === Object) {
      const sanitized: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          // Convert problematic fields to strings
          if (key === 'parameters' || key === 'driverError') {
            sanitized[key] = JSON.stringify(obj[key]);
          } else {
            sanitized[key] = sanitize(obj[key]);
          }
        }
      }
      return sanitized;
    }
    
    return obj;
  };

  return sanitize(logData);
};

const esTransportOpts = {
  level: 'info',
  clientOpts: {
    node: 'http://elasticsearch:9200',
    requestTimeout: 10000,
  },
  indexPrefix: 'trip-mate-logs',
  buffering: false,
  flushInterval: 2000,
  transformer: sanitizeForElasticsearch,
};

const esErrorTransportOpts = {
  level: 'error',
  clientOpts: {
    node: 'http://elasticsearch:9200',
    requestTimeout: 10000,
  },
  indexPrefix: 'trip-mate-errors',
  buffering: false,
  flushInterval: 2000,
  transformer: sanitizeForElasticsearch,
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
    esErrorTransport,  // Also send errors to trip-mate-errors index
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
