import * as winston from 'winston';
import { baseFormat, logDir, makeEsTransport } from './logger';
import 'winston-daily-rotate-file';

const onlyErrors = winston.format((info) => {
  return info.level === 'error' ? info : false;
})();

const dailyRotateError = new winston.transports.DailyRotateFile({
  dirname: logDir,
  filename: 'errors-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '30d',
  level: 'error',
});

const errorLogger = winston.createLogger({
  level: 'error',
  format: baseFormat,
  transports: [
    makeEsTransport('error', 'trip-mate-errors'),
    new winston.transports.Console(),
    dailyRotateError,
  ],
});

export default errorLogger;