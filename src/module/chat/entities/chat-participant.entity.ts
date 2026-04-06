import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { ChatConversation } from './chat-conversation.entity';
import { Account } from 'src/module/account/entity/account.entity';

@Entity('chat_participants')
@Unique('uq_chat_participant_conversation_account', ['conversationId', 'accountId'])
export class ChatParticipant {
  @PrimaryGeneratedColumn('identity')
  id: bigint;

  @Column({ name: 'conversation_id', type: 'bigint' })
  conversationId: bigint;

  @ManyToOne(() => ChatConversation, (conversation) => conversation.participants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversation_id' })
  conversation: ChatConversation;

  @Column({ name: 'account_id', type: 'bigint' })
  accountId: bigint;

  @ManyToOne(() => Account, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'account_id' })
  account: Account;

  @Column({ name: 'last_read_message_id', type: 'bigint', nullable: true })
  lastReadMessageId?: bigint;

  @Column({ name: 'last_read_at', type: 'timestamp', nullable: true })
  lastReadAt?: Date;

  @CreateDateColumn({ name: 'joined_at' })
  joinedAt: Date;
}
