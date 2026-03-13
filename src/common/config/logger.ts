import { ElasticsearchTransport } from 'winston-elasticsearch';
import * as winston from 'winston';
import * as path from 'path';
import * as fs from 'fs';
import 'winston-daily-rotate-file';

export const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

/**
 * Deeply stringify any nested objects/arrays in a fields map
 * so Elasticsearch doesn't create dynamic nested mappings.
 */
const stringifyNestedFields = (obj: Record<string, any>): Record<string, any> => {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) {
      result[key] = value;
    } else if (typeof value === 'object') {
      result[key] = JSON.stringify(value);
    } else {
      result[key] = value;
    }
  }
  return result;
};

/**
 * Custom transformer that properly flattens log data for Elasticsearch.
 *
 * Handles the case where winston `message` is an object (from logger.info({...}))
 * by extracting a human-readable string for the `message` field and moving
 * all structured properties into `fields`.
 */
export const sanitizeForElasticsearch = (logData: any) => {
  const transformed: Record<string, any> = {};

  transformed['@timestamp'] = logData.timestamp
    ? logData.timestamp
    : new Date().toISOString();
  transformed.severity = logData.level;

  // Handle message: if it's an object, extract a readable string and merge
  // the object's properties into the meta/fields.
  let messageStr: string;
  let extraFields: Record<string, any> = {};

  if (logData.message && typeof logData.message === 'object') {
    // Build a human-readable message from known fields
    const msg = logData.message;
    if (msg.type === 'request') {
      messageStr = `[${msg.type}] ${msg.method || ''} ${msg.url || ''}`;
    } else if (msg.type === 'response') {
      messageStr = `[${msg.type}] ${msg.statusCode || ''} ${msg.url || ''}`;
    } else {
      messageStr = JSON.stringify(msg);
    }
    // All message properties become searchable fields
    extraFields = { ...msg };
  } else {
    messageStr = logData.message ? String(logData.message) : '';
  }

  transformed.message = messageStr;

  // Merge meta (extra winston fields) with extraFields from the message object
  const allFields = { ...(logData.meta || {}), ...extraFields };

  // Remove internal winston fields that are not useful in ES
  delete allFields.timestamp;
  delete allFields.level;

  // Stringify all nested objects to prevent ES mapping explosions
  transformed.fields = stringifyNestedFields(allFields);

  return transformed;
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