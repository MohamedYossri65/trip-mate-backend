import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  UseInterceptors,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { CustomI18nService } from '../localization/custom-i18n.service';

export function SuccessResponse(messageKey: string, status: number = 200) {
  return UseInterceptors(new SuccessResponseInterceptor(messageKey));
}

@Injectable()
class SuccessResponseInterceptor implements NestInterceptor {
  constructor(
    private readonly messageKey: string,
  ) {}

  intercept(
    context: ExecutionContext,
    handler: CallHandler<any>,
  ): Observable<any> {
    const i18n = context.switchToHttp().getRequest().i18nService as CustomI18nService;

    return handler.handle().pipe(
      map((data) => {
        const message = i18n.t(this.messageKey);

        if (data == null) {
          return {
            success: true,
            message: message,
            data: null,
          };
        }
        return {
          success: true,
          message: message,
          data: Object.keys(data).length === 0 ? [] : data,
        };
      }),
    );
  }
}