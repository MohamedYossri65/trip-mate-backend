import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { logger } from './common/config/logger.app';
@Injectable()
export class LoggerMiddleware implements NestMiddleware {

  private readonly IGNORED_PATHS = [
    '/assets',
    '/favicon.ico',
    '/health',
    '/_next',
    '/static',
  ];

  use(req: Request, res: Response, next: NextFunction) {

    // Skip static assets and health checks
    if (this.IGNORED_PATHS.some(p => req.originalUrl.startsWith(p))) {
      return next();
    }

    const startTime = Date.now();
    const requestId = uuid();

    res.setHeader('x-request-id', requestId);

    const maskedBody = this.maskSensitiveData(req.body);

    logger.info({
      type: 'request',
      requestId,
      method: req.method,
      url: req.originalUrl,
      headers: JSON.stringify({
        'content-type': req.headers['content-type'],
        authorization: req.headers['authorization']
          ? req.headers['authorization'].slice(0, 20) + '...'
          : undefined
      }),
      body: maskedBody && typeof maskedBody === 'object'
        ? JSON.stringify(maskedBody)
        : String(maskedBody ?? ''),
      ip: req.ip
    });

    const originalSend = res.send;

    res.send = (body: any) => {

      const responseTime = Date.now() - startTime;
      const parsedBody = this.safeParse(body);

      logger.info({
        type: 'response',
        requestId,
        statusCode: res.statusCode,
        responseTime: `${responseTime}ms`,
        body: typeof parsedBody === 'object' && parsedBody !== null
          ? JSON.stringify(parsedBody)
          : String(parsedBody ?? '')
      });

      return originalSend.call(res, body);
    };

    next();
  }

  private maskSensitiveData(body: any) {

    if (!body || typeof body !== 'object') return body;

    return {
      ...body,
      password: body.password ? '****' : undefined,
      token: body.token ? '****' : undefined,
      data: {
        ...body.data,
        accessToken: body.data?.accessToken ? '****' : undefined,
        refreshToken: body.data?.refreshToken ? '****' : undefined,
      }
    };
  }

  private safeParse(body: any) {

    try {
      if (typeof body === 'string') {
        const parsedBody = JSON.parse(body);

        return this.maskSensitiveData(parsedBody);
      }
      return body;
    } catch {
      return body;
    }

  }
}