import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { RolesEnum } from 'src/common/enums/roles.enum';
import { JwtAuthGuard } from '../auth.guard';
import { RolesGuard } from '../roles.guard';


export function Auth(...roles: RolesEnum[]) {
  return applyDecorators(
    SetMetadata('roles', roles),
    UseGuards(JwtAuthGuard, RolesGuard),
  );
}
