import {
    Injectable,
    CanActivate,
    ExecutionContext,
    HttpException,
} from '@nestjs/common';
import { ResponseCode } from '../constant/responses-code';
import { AccountStatus } from '../enums/account-status.enum';
import { RolesEnum } from '../enums/roles.enum';
import { IS_PUBLIC_KEY } from './decorators/public.decorator';
import { Reflector } from '@nestjs/core';

@Injectable()
export class OfficeProcessGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();

        const isPublic = this.reflector.getAllAndOverride<boolean>(
            IS_PUBLIC_KEY,
            [context.getHandler(), context.getClass()],
        );

        if (isPublic) {
            return true;
        }
        const user = request.user;

        if (!user) return true;

        if (user.role === RolesEnum.OFFICE) {
            if (user.status === AccountStatus.PENDING_REVIEW) {
                throw new HttpException(
                    'Office still under review',
                    ResponseCode.OFFICE_UNDER_REVIEW,
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

        return true;
    }
}