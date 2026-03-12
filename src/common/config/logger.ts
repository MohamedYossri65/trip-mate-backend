import { ElasticsearchTransformer, ElasticsearchTransport } from 'winston-elasticsearch';
import * as winston from 'winston';
import * as path from 'path';
import * as fs from 'fs';
import 'winston-daily-rotate-file';

export const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

export const sanitizeForElasticsearch = (logData: any) => {
  const transformed = ElasticsearchTransformer(logData);
  const fields = transformed.fields as unknown as Record<string, any>;

  if (fields?.parameters) {
    fields.parameters = JSON.stringify(fields.parameters);
  }
  if (fields?.driverError) {
    fields.driverError = JSON.stringify(fields.driverError);
  }

  return { ...transformed, fields };
};

export const makeEsTransport = (level: string, indexPrefix: string) => {
  const esNode = process.env.ELASTICSEARCH_URL || 'http://localhost:9200';

  const t = new ElasticsearchTransport({
    level,
    clientOpts: {
      node: esNode,
      requestTimeout: 10000,
    },
    indexPrefix,
    buffering: false,
    flushInterval: 2000,
    transformer: sanitizeForElasticsearch,
  });

  t.on('error', (err: Error) => {
    console.error(`[winston-elasticsearch][${indexPrefix}] error:`, err.message);
  });

  return t;
};

export const baseFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);