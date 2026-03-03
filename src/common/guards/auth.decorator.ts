import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth.guard';
import { RolesGuard } from './roles.guard';
import { RolesEnum } from '../enums/roles.enum';

export function Auth(...roles: RolesEnum[]) {
  return applyDecorators(
    SetMetadata('roles', roles),
    UseGuards(JwtAuthGuard, RolesGuard),
  );
}
