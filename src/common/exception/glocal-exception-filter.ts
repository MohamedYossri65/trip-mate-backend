import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { I18nValidationException } from 'nestjs-i18n';
import errorLogger from '../config/logger.error';

const safeSerialize = (value: any): any => {
  try {
    return JSON.parse(JSON.stringify(value, (_k, v) =>
      typeof v === 'bigint' ? v.toString() : v
    ));
  } catch {
    return String(value);
  }
};

@Injectable()
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private appEnv: string;

  constructor(private readonly configService: ConfigService) {
    this.appEnv = this.configService.get<string>('APP_ENV') || 'development';
  }

  async catch(exception: unknown, host: ArgumentsHost) {
    const httpContext = host.switchToHttp();
    const request = httpContext.getRequest<Request>();
    const response = httpContext.getResponse<Response>();

    // Handle I18nValidationException with proper formatting
    if (exception instanceof I18nValidationException) {
      await this.handleI18nValidationException(exception, request, response);
      return;
    }

    if (exception instanceof HttpException) {
      await this.handleHttpException(exception, request, response);
    } else if (
      exception instanceof Error &&
      this.appEnv === 'development'
    ) {
      await this.handleGenericError(exception, request, response);
    } else {
      await this.handleUnknownError(exception, request, response);
    }
  }

  private async handleI18nValidationException(
    exception: I18nValidationException,
    request: Request,
    response: Response,
  ) {
    const status = HttpStatus.BAD_REQUEST;

    // Transform validation errors to a more user-friendly format
    const formattedErrors = this.formatValidationErrors(exception.errors);

    const responseBody = {
      success: false,
      message: 'bad request',
      data: null,
      // ...(this.appEnv !== AppEnv.Production && {
      //   // errors: formattedErrors,
      // }),
      errors: formattedErrors,
      timestamp: new Date().toISOString(),
    };

    return response.status(status).json(responseBody);
  }

  private formatValidationErrors(errors: any[]): string[] {
    return errors.map((error) => {
      const constraints = error.constraints || {};
      // Return the first constraint message as a string, or a default message
      const firstConstraint = Object.values(constraints)[0];
      return typeof firstConstraint === 'string'
        ? firstConstraint
        : 'Invalid value';
    });
  }

  private async handleHttpException(
    exception: HttpException,
    request: Request,
    response: Response,
  ) {
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let message = exception.message;
    const errorMessage =
      typeof exceptionResponse === 'object'
        ? (exceptionResponse as any).message
        : exceptionResponse;

    const errors = Array.isArray(errorMessage) ? errorMessage : [errorMessage];

    // Handle validation-like errors from HttpException
    if (
      errors.some(
        (error) => typeof error === 'string' && error.includes('should'),
      )
    ) {
      message = 'Validation Error';
    }

    const responseBody = {
      success: false,
      message: message,
      data: null,
      errors: errors,
      // errorCode: errorCode,
      ...(this.appEnv === 'development' && {
        stack: exception.stack,
        url: request?.originalUrl,
      }),
      timestamp: new Date().toISOString(),
    };

    if (status >= 500) {
      errorLogger.error('HttpException 5xx', {
        statusCode: status,
        message,
        request: {
          method: request.method,
          url: request.originalUrl,
          body: safeSerialize(request.body),
          params: request.params,
          query: request.query,
        },
        stack: exception.stack,
      });
    }

    response.status(status).json(responseBody);
  }

  private async handleGenericError(
    exception: Error,
    request: Request,
    response: Response,
  ) {
    const errorContext = this.getErrorContext(request);
    const detailedMessage = `Failed to ${errorContext}: ${exception.message}`;

    const messageToTranslate =
      this.appEnv === 'development'
        ? detailedMessage
        : "Something went wrong";
    
    const responseBody = {
      success: false,
      message: messageToTranslate,
      data: null,
      errors: [detailedMessage],
      ...(this.appEnv === 'development' && {
        stack: exception.stack,
        url: request?.originalUrl,
      }),
      timestamp: new Date().toISOString(),
    };

    errorLogger.error('Programming error occurred', {
      errorMessage: exception.message,
      stack: exception.stack,
      request: {
        method: request.method,
        url: request.originalUrl,
        body: safeSerialize(request.body),
        params: request.params,
        query: request.query,
      },
    });

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(responseBody);
  }

  private async handleUnknownError(
    exception: any,
    request: Request,
    response: Response,
  ) {
    const message = exception.message;

    const responseBody = {
      success: false,
      message: "Something went wrong",
      data: null,
      errors: [ "Something went wrong"],
      ...(this.appEnv === 'development' && {
        originalError: message,
      }),
      timestamp: new Date().toISOString(),
    };

    errorLogger.error('Unknown error occurred', {
      errorMessage: message,
      error: safeSerialize(exception),
      stack: exception.stack,
      request: {
        method: request.method,
        url: request.originalUrl,
        body: safeSerialize(request.body),
        params: request.params,
        query: request.query,
      },
    });

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(responseBody);
  }

  private getErrorContext(request: Request): string {
    const path = request.path;
    const method = request.method;
    const resource = this.extractResourceName(path);

    const actionMap: Record<string, string> = {
      GET: 'retrieve',
      POST: 'create',
      PUT: 'update',
      PATCH: 'update',
      DELETE: 'delete',
    };

    return actionMap[method]
      ? `${actionMap[method]} ${resource}`
      : `process ${resource}`;
  }

  private extractResourceName(path: string): string {
    const segments = path.split('/').filter(Boolean);
    if (segments.length === 0) return 'resource';
    // Skip API prefix if present
    const resourceIndex = segments[0] === 'api' ? 1 : 0;
    const resourceSegment = segments[resourceIndex] || segments[0];

    // Plural to singular conversion (simple version)
    return resourceSegment.endsWith('s')
      ? resourceSegment.slice(0, -1)
      : resourceSegment;
  }
}
