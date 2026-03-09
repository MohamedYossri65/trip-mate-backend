import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    HttpException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { RolesEnum } from '../enums/roles.enum';
import { AccountStatus } from '../enums/account-status.enum';
import { ResponseCode } from '../constant/responses-code';

@Injectable()
export class UserProcessInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();

        if (request.url?.includes('/register') || request.url?.includes('/auth') || request.url?.includes('/offices')) {
            return next.handle();
        }

        const user = request.user;
        if (user && user.role === RolesEnum.OFFICE) {
            if (user.status === AccountStatus.PENDING_REVIEW) {
                throw new HttpException('Office still under review', ResponseCode.OFFICE_UNDER_REVIEW);
            } else if (user.status === AccountStatus.REJECTED) {
                throw new HttpException('Office rejected', ResponseCode.OFFICE_REJECTED);
            } else if (user.status === AccountStatus.PENDING_OTP) {
                throw new HttpException('Office pending OTP', ResponseCode.OFFICE_PENDING_OTP);
            }
        }

        return next.handle();
    }
}