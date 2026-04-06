import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ChatConversation } from './chat-conversation.entity';
import { Account } from 'src/module/account/entity/account.entity';
import { MessageType } from '../enums/chat.enums';

export type OfferMessageDetails = {
  bookingType: string;
  createdAt: string;
  offerPrice: number;
  offerId: bigint;
};

@Entity('chat_messages')
export class ChatMessage {
  @PrimaryGeneratedColumn('identity')
  id: bigint;

  @Column({ name: 'conversation_id', type: 'bigint' })
  conversationId: bigint;

  @ManyToOne(() => ChatConversation, (conversation) => conversation.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversation_id' })
  conversation: ChatConversation;

  @Column({ name: 'sender_account_id', type: 'bigint' })
  senderAccountId: bigint;

  @ManyToOne(() => Account, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sender_account_id' })
  sender: Account;

  @Column({ type: 'enum', enum: MessageType, default: MessageType.TEXT })
  type: MessageType;

  @Column({ type: 'text', nullable: true })
  content?: string;

  @Column({ name: 'attachment_url', type: 'text', nullable: true })
  attachmentUrl?: string;

  @Column({ name: 'audio_duration_sec', type: 'int', nullable: true })
  audioDurationSec?: number;

  @Column({ name: 'offer_details', type: 'simple-json', nullable: true })
  offerDetails?: OfferMessageDetails;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
