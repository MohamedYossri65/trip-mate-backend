import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    console.log('=============Request Start=============');
    console.log('Request Method:', req.method);
    console.log('Request URL:', req.originalUrl);
    console.log('Request Headers:', req.headers);
    console.log('Request Body:', req.body);
    console.log('==============Request END==============');

    const originalSend = res.send;

    res.send = function (body) {
      console.log('=============Response Start=============');
      console.log('Response Status Code:', res.statusCode);
      console.log('Response Headers:', res.getHeaders());
      console.log('Response Body:', body);
      console.log('==============Response END==============');

      return originalSend.call(this, body);
    };

    next();
  }
}
