import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ConversationType } from '../enums/chat.enums';
import { ChatParticipant } from './chat-participant.entity';
import { ChatMessage } from './chat-message.entity';

@Entity('chat_conversations')
export class ChatConversation {
  @PrimaryGeneratedColumn('identity')
  id: bigint;

  @Column({ type: 'enum', enum: ConversationType, default: ConversationType.DIRECT })
  type: ConversationType;

  @Column({ name: 'booking_id', type: 'bigint' , nullable: true })
  bookingId: bigint;

  @Column({ name: 'user_account_id', type: 'bigint' })
  userAccountId: bigint;

  @Column({ name: 'office_account_id', type: 'bigint' })
  officeAccountId: bigint;

  @Column({ name: 'created_by_account_id', type: 'bigint' })
  createdByAccountId: bigint;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => ChatParticipant, (participant) => participant.conversation)
  participants: ChatParticipant[];

  @OneToMany(() => ChatMessage, (message) => message.conversation)
  messages: ChatMessage[];
}

