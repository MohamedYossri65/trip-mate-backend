import * as fs from 'fs';
import * as path from 'path';
import { createLogger, format, transports, Logger } from 'winston';

const logDir: string = path.join(process.cwd(), 'logs');

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const cleanupOldFiles = () => {
  const files = fs.readdirSync(logDir)
    .filter(file => file.startsWith('errors-') && file.endsWith('.json'))
    .map(file => ({
      name: file,
      path: path.join(logDir, file),
      time: fs.statSync(path.join(logDir, file)).mtime.getTime()
    }))
    .sort((a, b) => b.time - a.time);

  // Keep only the last 10 files
  files.slice(10).forEach(file => {
    fs.unlinkSync(file.path);
  });
};

const bigIntReplacer = (_key: string, value: any) =>
  typeof value === 'bigint' ? value.toString() : value;

const arrayFormat = format((info) => {
  const logFile = path.join(logDir, 'errors.json');
  const historyFile = path.join(logDir, `errors-${Date.now()}.json`);
  let logs: any[] = [];
  
  if (fs.existsSync(logFile)) {
    const fileContent = fs.readFileSync(logFile, 'utf8');
    logs = fileContent ? JSON.parse(fileContent) : [];
  }
  
  logs.push(info);
  
  if (logs.length >= 100) {
    fs.writeFileSync(historyFile, JSON.stringify(logs, bigIntReplacer, 2));
    cleanupOldFiles(); // Clean up old files after creating a new one
    logs = [info];
  }
  
  fs.writeFileSync(logFile, JSON.stringify(logs, bigIntReplacer, 2));
  
  return info;
});

const winstonLogger: Logger = createLogger({
  level: 'error',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.json(),
    arrayFormat()
  ),
  transports: [
    new transports.Console()
  ]
});

export default winstonLogger;