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

// الرئيسية - Main
class MainPermissionsDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  enabled: boolean;
}

// آخر الأحداث - Latest Events
class LastEventsPermissionsDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  enabled: boolean;
}

// العروض - Offers
class OfferPermissionsDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  createNewOffers?: boolean; // تقديم عروض جديدة

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  followUpOffers?: boolean; // متابعة العروض للمقدمة والمنتهية
}

// الحساب المالي - Financial Account
class FinancialAccountPermissionsDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  requestMoneyTransfer?: boolean; // إرسال طلب تحويل أموال

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  recordTransactions?: boolean; // سجل التعاملات

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  viewOfficeProfits?: boolean; // الإطلاع على أرباح المكتب
}

// الأدوار - Roles
class RolesPermissionsDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  addNewRoles?: boolean; // إضافة أدوار جديدة

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  editRoles?: boolean; // تعديل الأدوار

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  sendNotificationsToOffices?: boolean; // إرسال إشعار خاص للمكاتب

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  sendNotificationsToUsers?: boolean; // إرسال إشعار خاص للمستخدمين
}

// الرسائل - Messages
class MessagesPermissionsDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  communicateWithCustomers?: boolean; // التواصل مع العملاء

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  createNewOffersInMessages?: boolean; // تقديم عروض جديدة ضمن الرسائل
}

// الاعدادات - Settings
class SettingsPermissionsDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  payment?: boolean; // الدفع

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  employees?: boolean; // الموظفين

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  subscriptions?: boolean; // الاشتراكات

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  officeData?: boolean; // بيانات المكتب
}

// Main Permissions Container
class RolePermissionsDto {
  @ApiProperty({ type: MainPermissionsDto, required: false })
  @ValidateNested()
  @Type(() => MainPermissionsDto)
  @IsOptional()
  main?: MainPermissionsDto;

  @ApiProperty({ type: LastEventsPermissionsDto, required: false })
  @ValidateNested()
  @Type(() => LastEventsPermissionsDto)
  @IsOptional()
  lastEvents?: LastEventsPermissionsDto;

  @ApiProperty({ type: OfferPermissionsDto, required: false })
  @ValidateNested()
  @Type(() => OfferPermissionsDto)
  @IsOptional()
  offer?: OfferPermissionsDto;

  @ApiProperty({ type: FinancialAccountPermissionsDto, required: false })
  @ValidateNested()
  @Type(() => FinancialAccountPermissionsDto)
  @IsOptional()
  financialAccount?: FinancialAccountPermissionsDto;

  @ApiProperty({ type: RolesPermissionsDto, required: false })
  @ValidateNested()
  @Type(() => RolesPermissionsDto)
  @IsOptional()
  roles?: RolesPermissionsDto;

  @ApiProperty({ type: MessagesPermissionsDto, required: false })
  @ValidateNested()
  @Type(() => MessagesPermissionsDto)
  @IsOptional()
  messages?: MessagesPermissionsDto;

  @ApiProperty({ type: SettingsPermissionsDto, required: false })
  @ValidateNested()
  @Type(() => SettingsPermissionsDto)
  @IsOptional()
  settings?: SettingsPermissionsDto;
}

export class CreateRoleDto {
  @ApiProperty({ example: 'Office Manager' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ type: RolePermissionsDto })
  @IsObject()
  @ValidateNested()
  @Type(() => RolePermissionsDto)
  permissions: RolePermissionsDto;
}

// Export individual permission classes for reuse
export {
  MainPermissionsDto,
  LastEventsPermissionsDto,
  OfferPermissionsDto,
  FinancialAccountPermissionsDto,
  RolesPermissionsDto,
  MessagesPermissionsDto,
  SettingsPermissionsDto,
  RolePermissionsDto,
};