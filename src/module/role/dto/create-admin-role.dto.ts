import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class MainPermissionsDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  viewAll?: boolean;
}

class RolesPermissionsDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  addRole?: boolean;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  addNewRoles?: boolean;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  editRole?: boolean;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  editRoles?: boolean;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  deleteRole?: boolean;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  blockAllRoles?: boolean;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  sendNotificationsToOffices?: boolean;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  sendNotificationsToUsers?: boolean;
}

class UsersPermissionsDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  disableUser?: boolean;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  editUser?: boolean;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  viewUserProfile?: boolean;
}

class SupervisorsPermissionsDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  addSupervisor?: boolean;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  editSupervisor?: boolean;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  deleteSupervisor?: boolean;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  changeAccountStatus?: boolean;
}

class NotificationsPermissionsDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  addNotification?: boolean;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  deleteNotification?: boolean;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  sendNotificationsToOffices?: boolean;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  sendNotificationsToUsers?: boolean;
}

class CouponsPermissionsDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  addCoupon?: boolean;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  editCoupon?: boolean;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  deleteCoupon?: boolean;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  publishCoupon?: boolean;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  archiveCoupon?: boolean;
}

class BannersPermissionsDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  addBanner?: boolean;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  editBanner?: boolean;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  deleteBanner?: boolean;
}

class TripsPermissionsDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  addTrip?: boolean;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  editTrip?: boolean;
}

class ContactMessagesPermissionsDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  viewMessages?: boolean;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  sendReply?: boolean;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  sendPrivateNotificationToOffices?: boolean;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  sendPrivateNotificationToUsers?: boolean;
}

class ReviewsPermissionsDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  deleteReview?: boolean;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  editReviewStatus?: boolean;
}

class SettingsPermissionsDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  general?: boolean;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  payment?: boolean;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  subscriptions?: boolean;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  services?: boolean;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  employees?: boolean;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  officeData?: boolean;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  agreements?: boolean;
}

class FinancialAccountPermissionsDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  viewTransferRequests?: boolean;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  approveOrRejectTransferRequests?: boolean;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  accountingLedger?: boolean;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  requestMoneyTransfer?: boolean;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  recordTransactions?: boolean;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  customerProfits?: boolean;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  viewOfficeProfits?: boolean;
}

class AdminRolePermissionsDto {
  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  editAllPermissions?: boolean;

  @ApiProperty({ type: MainPermissionsDto, required: false })
  @ValidateNested()
  @Type(() => MainPermissionsDto)
  @IsOptional()
  main?: MainPermissionsDto;

  @ApiProperty({ type: RolesPermissionsDto, required: false })
  @ValidateNested()
  @Type(() => RolesPermissionsDto)
  @IsOptional()
  roles?: RolesPermissionsDto;

  @ApiProperty({ type: UsersPermissionsDto, required: false })
  @ValidateNested()
  @Type(() => UsersPermissionsDto)
  @IsOptional()
  users?: UsersPermissionsDto;

  @ApiProperty({ type: SupervisorsPermissionsDto, required: false })
  @ValidateNested()
  @Type(() => SupervisorsPermissionsDto)
  @IsOptional()
  supervisors?: SupervisorsPermissionsDto;

  @ApiProperty({ type: NotificationsPermissionsDto, required: false })
  @ValidateNested()
  @Type(() => NotificationsPermissionsDto)
  @IsOptional()
  notifications?: NotificationsPermissionsDto;

  @ApiProperty({ type: CouponsPermissionsDto, required: false })
  @ValidateNested()
  @Type(() => CouponsPermissionsDto)
  @IsOptional()
  coupons?: CouponsPermissionsDto;

  @ApiProperty({ type: BannersPermissionsDto, required: false })
  @ValidateNested()
  @Type(() => BannersPermissionsDto)
  @IsOptional()
  banners?: BannersPermissionsDto;

  @ApiProperty({ type: TripsPermissionsDto, required: false })
  @ValidateNested()
  @Type(() => TripsPermissionsDto)
  @IsOptional()
  trips?: TripsPermissionsDto;

  @ApiProperty({ type: ContactMessagesPermissionsDto, required: false })
  @ValidateNested()
  @Type(() => ContactMessagesPermissionsDto)
  @IsOptional()
  contactMessages?: ContactMessagesPermissionsDto;

  @ApiProperty({ type: ReviewsPermissionsDto, required: false })
  @ValidateNested()
  @Type(() => ReviewsPermissionsDto)
  @IsOptional()
  reviews?: ReviewsPermissionsDto;

  @ApiProperty({ type: SettingsPermissionsDto, required: false })
  @ValidateNested()
  @Type(() => SettingsPermissionsDto)
  @IsOptional()
  settings?: SettingsPermissionsDto;

  @ApiProperty({ type: FinancialAccountPermissionsDto, required: false })
  @ValidateNested()
  @Type(() => FinancialAccountPermissionsDto)
  @IsOptional()
  financialAccount?: FinancialAccountPermissionsDto;
}

export class CreateAdminRoleDto {
  @ApiProperty({ example: 'Admin Manager' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ type: AdminRolePermissionsDto })
  @IsObject()
  @ValidateNested()
  @Type(() => AdminRolePermissionsDto)
  permissions: AdminRolePermissionsDto;
}

export { AdminRolePermissionsDto };
