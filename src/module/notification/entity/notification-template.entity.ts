import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { NotificationChannel } from '../enums';

@Entity('notification_templates')
@Unique(['templateKey', 'language', 'channel'])
export class NotificationTemplate {
  @PrimaryGeneratedColumn('identity')
  id: number;

  @Column({ name: 'template_key' })
  templateKey: string;

  @Column({ length: 10 })
  language: string;

  @Column({ type: 'enum', enum: NotificationChannel, default: NotificationChannel.PUSH })
  channel: NotificationChannel;

  @Column({ name: 'title_template', type: 'text' })
  titleTemplate: string;

  @Column({ name: 'body_template', type: 'text' })
  bodyTemplate: string;

  @Column({ length: 3, default: 'ltr' })
  direction: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
