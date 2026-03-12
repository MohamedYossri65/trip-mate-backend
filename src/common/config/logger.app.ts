import * as winston from 'winston';
import 'winston-daily-rotate-file';
import { baseFormat, logDir, makeEsTransport } from './logger';

const onlyInfo = winston.format((info) => {
  return info.level !== 'error' ? info : false;
})();

const dailyRotateApp = new winston.transports.DailyRotateFile({
  dirname: logDir,
  filename: 'app-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
  level: 'info',
  format: onlyInfo,
});

export const logger = winston.createLogger({
  level: 'info',
  format: baseFormat,
  transports: [
    makeEsTransport('info', 'trip-mate-logs'),
    new winston.transports.Console({
      format: onlyInfo,
    }),
    dailyRotateApp,
  ],
});