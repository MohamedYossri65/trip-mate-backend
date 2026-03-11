import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { ResponseCode } from '../constant/responses-code';
import { AccountStatus } from '../enums/account-status.enum';
import { RolesEnum } from '../enums/roles.enum';
import { IS_PUBLIC_KEY } from '../guards/decorators/public.decorator';

@Injectable()
export class OfficeProcessInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isPublic) {
      return next.handle();
    }

    const user = request.user;

    if (!user) {
      return next.handle();
    }

    if (user.role === RolesEnum.OFFICE) {
      if (user.status === AccountStatus.PENDING_REVIEW) {
        throw new HttpException(
          'Office still under review',
          ResponseCode.OFFICE_UNDER_REVIEW,
        );
      }

      if (user.status === AccountStatus.OFFICE_NO_SUBSCRIPTION) {
        throw new HttpException(
          'Office has no active subscription',
          ResponseCode.OFFICE_NO_SUBSCRIPTION,
        );
      }

      if (user.status === AccountStatus.REJECTED) {
        throw new HttpException(
          'Office rejected',
          ResponseCode.OFFICE_REJECTED,
        );
      }

      if (user.status === AccountStatus.PENDING_OTP) {
        throw new HttpException(
          'Office pending OTP',
          ResponseCode.OFFICE_PENDING_OTP,
        );
      }
    }

    return next.handle();
  }
}
