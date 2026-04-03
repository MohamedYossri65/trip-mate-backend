import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatConversation } from './entities/chat-conversation.entity';
import { ChatParticipant } from './entities/chat-participant.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { Account } from '../account/entity/account.entity';
import { AccountModule } from '../account/account.module';
import { JwtModule } from '@nestjs/jwt';
import { Offer } from '../offers/entity/offer.entity';
import { OfficeEmployee } from '../office/entity/employee.entity';
import { OfficeModule } from '../office/office.module';
import { OnlineStatusService } from './services/online-status.service';
import { UserProfile } from '../user/entity/user.entity';
import { OfficeProfile } from '../office/entity/office.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ChatConversation,
      ChatParticipant,
      ChatMessage,
      Account,
      Offer,
      OfficeEmployee,
      UserProfile,
      OfficeProfile,
    ]),
    AccountModule,
    OfficeModule,
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET,
    }),
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway, OnlineStatusService],
  exports: [ChatService],
})
export class ChatModule {}
