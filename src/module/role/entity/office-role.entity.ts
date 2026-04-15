import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('office_roles')
export class OfficeRole {
  @PrimaryGeneratedColumn('identity')
  id: bigint;

  @Column({ unique: true })
  name: string;

  @Column({ type: 'jsonb' })
  permissions: RoleOfficePermissions;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ type: 'bigint' })
  createdBy: bigint;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
/**
 * Complete office/system permissions structure
 * Each feature has an `enabled` flag and granular sub-permissions
 */
export interface RoleOfficePermissions {
  // الرئيسية - Main
  main?: {
    enabled: boolean;
  };

  // آخر الأحداث - Latest Events
  lastEvents?: {
    enabled: boolean;
  };

  // العروض - Offers
  offer?: {
    enabled: boolean;
    createNewOffers?: boolean;           // تقديم عروض جديدة
    followUpOffers?: boolean;            // متابعة العروض للمقدمة والمنتهية
  };

  // الحساب المالي - Financial Account
  financialAccount?: {
    enabled: boolean;
    requestMoneyTransfer?: boolean;      // إرسال طلب تحويل أموال
    recordTransactions?: boolean;        // سجل التعاملات
    viewOfficeProfits?: boolean;         // الإطلاع على أرباح المكتب
  };

  // الأدوار - Roles
  roles?: {
    enabled: boolean;
    addNewRoles?: boolean;               // إضافة أدوار جديدة
    editRoles?: boolean;                 // تعديل الأدوار
    sendNotificationsToOffices?: boolean; // إرسال إشعار خاص للمكاتب
    sendNotificationsToUsers?: boolean;   // إرسال إشعار خاص للمستخدمين
  };

  // الرسائل - Messages
  messages?: {
    enabled: boolean;
    communicateWithCustomers?: boolean;   // التواصل مع العملاء
    createNewOffersInMessages?: boolean;  // تقديم عروض جديدة ضمن الرسائل
  };

  // الاعدادات - Settings
  settings?: {
    enabled: boolean;
    payment?: boolean;                    // الدفع
    employees?: boolean;                  // الموظفين
    subscriptions?: boolean;              // الاشتراكات
    officeData?: boolean;                 // بيانات المكتب
  };
}




