import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('admin_roles')
export class AdminRole {
  @PrimaryGeneratedColumn('identity')
  id!: bigint;

  @Column({ unique: true })
  name!: string;

  @Column({ type: 'jsonb' })
  permissions!: RoleAdminPermissions;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ type: 'bigint' })
  createdBy!: bigint;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

export interface RoleAdminPermissions {
  // تعديل كل الصلاحيات
  editAllPermissions?: boolean;

  // الرئيسية
  main?: {
    enabled: boolean;
    viewAll?: boolean;
  };

  // الأدوار
  roles?: {
    enabled: boolean;
    addRole?: boolean;
    addNewRoles?: boolean;
    editRole?: boolean;
    editRoles?: boolean;
    deleteRole?: boolean;
    blockAllRoles?: boolean;
    sendNotificationsToOffices?: boolean;
    sendNotificationsToUsers?: boolean;
  };

  // المستخدمين
  users?: {
    enabled: boolean;
    disableUser?: boolean;
    editUser?: boolean;
    viewUserProfile?: boolean;
  };

  // المشرفين
  supervisors?: {
    enabled: boolean;
    addSupervisor?: boolean;
    editSupervisor?: boolean;
    deleteSupervisor?: boolean;
    changeAccountStatus?: boolean;
  };

  // الإشعارات
  notifications?: {
    enabled: boolean;
    addNotification?: boolean;
    deleteNotification?: boolean;
    sendNotificationsToOffices?: boolean;
    sendNotificationsToUsers?: boolean;
  };

  // الكوبونات
  coupons?: {
    enabled: boolean;
    addCoupon?: boolean;
    editCoupon?: boolean;
    deleteCoupon?: boolean;
    publishCoupon?: boolean;
    archiveCoupon?: boolean;
  };

  // الرحلات
  trips?: {
    enabled: boolean;
    addTrip?: boolean;
    editTrip?: boolean;
  };

  // رسائل التواصل
  contactMessages?: {
    enabled: boolean;
    viewMessages?: boolean;
    sendReply?: boolean;
    sendPrivateNotificationToOffices?: boolean;
    sendPrivateNotificationToUsers?: boolean;
  };

  // التقييمات
  reviews?: {
    enabled: boolean;
    deleteReview?: boolean;
    editReviewStatus?: boolean;
  };

  // الإعدادات
  settings?: {
    enabled: boolean;
    general?: boolean;
    payment?: boolean;
    subscriptions?: boolean;
    services?: boolean;
    employees?: boolean;
    officeData?: boolean;
    agreements?: boolean;
  };

  // الحساب المالي
  financialAccount?: {
    enabled: boolean;
    viewTransferRequests?: boolean;
    approveOrRejectTransferRequests?: boolean;
    accountingLedger?: boolean;
    requestMoneyTransfer?: boolean;
    recordTransactions?: boolean;
    customerProfits?: boolean;
    viewOfficeProfits?: boolean;
  };

  // الإعلانات
  banners?: {
    enabled: boolean;
    addBanner?: boolean;
    editBanner?: boolean;
    deleteBanner?: boolean;
  };
}
