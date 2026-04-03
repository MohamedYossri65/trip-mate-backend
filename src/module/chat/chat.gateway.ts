import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { AccountService } from '../account/account.service';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { TypingDto } from './dto/typing.dto';
import { MarkAsReadDto } from './dto/mark-as-read.dto';
import { OnlineStatusService } from './services/online-status.service';
import { cli } from 'winston/lib/winston/config';

type JwtPayload = {
  sub: string;
  role: string;
  iat: number;
  exp: number;
};

@Injectable()
@WebSocketGateway({
  namespace: 'chat',
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private readonly userSockets = new Map<string, Set<string>>();
  private readonly socketUsers = new Map<string, string>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly accountService: AccountService,
    private readonly chatService: ChatService,
    private readonly onlineStatusService: OnlineStatusService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = this.extractToken(client);
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: process.env.JWT_ACCESS_SECRET,
      });

      const account = await this.accountService.findById(BigInt(payload.sub));
      if (!account) {
        client.disconnect(true);
        return;
      }

      const userId = account.id.toString();
      client.data.userId = userId;

      this.socketUsers.set(client.id, userId);
      const sockets = this.userSockets.get(userId) ?? new Set<string>();
      sockets.add(client.id);
      this.userSockets.set(userId, sockets);

      // Mark user as online in the shared status service
      this.onlineStatusService.markOnline(userId, client.id);

      const conversationIds = await this.chatService.getConversationIdsForUser(account.id);
      for (const conversationId of conversationIds) {
        await client.join(this.roomName(conversationId));
      }

      // Notify other participants that this user is online
      for (const conversationId of conversationIds) {
        this.server.to(this.roomName(conversationId)).emit('user_online', {
          event: 'user_online',
          data: {
            userId,
            conversationId,
            timestamp: new Date(),
          },
        });
      }
    } catch (error) {
      this.logger.warn(`Socket auth failed for ${client.id}: ${(error as Error).message}`);
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = this.socketUsers.get(client.id);
    if (!userId) {
      return;
    }

    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.delete(client.id);
      if (!sockets.size) {
        this.userSockets.delete(userId);
        // Mark user as offline only if they have no other connections
        this.onlineStatusService.markOffline(userId, client.id);
        
        // Notify other participants that this user is offline
        const conversationIds = await this.chatService.getConversationIdsForUser(BigInt(userId));
        for (const conversationId of conversationIds) {
          this.server.to(this.roomName(conversationId)).emit('user_offline', {
            event: 'user_offline',
            data: {
              userId,
              conversationId,
              timestamp: new Date(),
            },
          });
        }
      } else {
        // User still has other connections, just remove this socket from the service
        this.onlineStatusService.markOffline(userId, client.id);
      }
    }

    this.socketUsers.delete(client.id);
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SendMessageDto,
  ) {
    const userId = this.getCurrentUserId(client);
    const message = await this.chatService.sendMessage(userId, payload);
    const conversationId = payload.conversationId;
    const room = this.roomName(conversationId);

    this.server.to(room).emit('new_message', {
      event: 'new_message',
      data: { message },
    });

    const participants = await this.chatService.getParticipantIds(BigInt(conversationId));
    const deliveredTo = participants.filter(
      (participantId) => participantId !== userId.toString() && this.userSockets.has(participantId),
    );

    if (deliveredTo.length) {
      this.server.to(client.id).emit('message_delivered', {
        event: 'message_delivered',
        data: {
          conversationId,
          messageId: message?.id ?? null,
          deliveredTo,
        },
      });
    }

    return {
      ok: true,
      message,
    };
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: TypingDto,
  ) {
    const userId = this.getCurrentUserId(client);
    await this.chatService.ensureParticipant(BigInt(payload.conversationId), userId);

    client.to(this.roomName(payload.conversationId)).emit('user_typing', {
      event: 'user_typing',
      data: {
        conversationId: payload.conversationId,
        userId: userId.toString(),
        isTyping: payload.isTyping,
      },
    });

    return { ok: true };
  }

  @SubscribeMessage('mark_as_read')
  async handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: MarkAsReadDto,
  ) {
    const userId = this.getCurrentUserId(client);
    const result = await this.chatService.markAsRead(userId, payload);

    this.server.to(this.roomName(payload.conversationId)).emit('message_read', {
      event: 'message_read',
      data: {
        conversationId: payload.conversationId,
        userId: userId.toString(),
        lastReadMessageId: result.lastReadMessageId,
        lastReadAt: result.lastReadAt,
      },
    });

    return {
      ok: true,
      ...result,
    };
  }


   @SubscribeMessage('is_user_online')
  async handleIsUserOnline(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { userId: string ,conversationId: string},
  ) {
    const isOnline = this.isUserOnline(payload.userId);
    if(isOnline){
          this.server.to(this.roomName(payload.conversationId)).emit('user_online', {
          event: 'user_online',
          data: {
            userId : payload.userId,
            conversationId : payload.conversationId,
            timestamp: new Date(),
          },
        });
    } else {
          this.server.to(this.roomName(payload.conversationId)).emit('user_offline', {
          event: 'user_offline',
          data: {
            userId : payload.userId,
            conversationId : payload.conversationId,
            timestamp: new Date(),
          },
        });
    }
  }

  /**
   * Check if a user is currently connected to the chat gateway
   */
  isUserOnline(userId: string): boolean {
    return this.onlineStatusService.isUserOnline(userId);
  }

  /**
   * Get online status for multiple users
   */
  getOnlineStatus(userIds: string[]): Map<string, boolean> {
    return this.onlineStatusService.getOnlineStatus(userIds);
  }

  private extractToken(client: Socket): string {
    const authToken = client.handshake.auth?.token;
    if (typeof authToken === 'string' && authToken.length > 0) {
      return authToken;
    }

    const headerToken = client.handshake.headers.authorization;
    if (typeof headerToken === 'string' && headerToken.startsWith('Bearer ')) {
      return headerToken.slice(7);
    }

    throw new Error('Missing websocket token');
  }

  private roomName(conversationId: string) {
    return `conversation:${conversationId}`;
  }

  private getCurrentUserId(client: Socket): bigint {
    const userId = client.data.userId;
    if (!userId) {
      throw new Error('Unauthenticated socket');
    }

    return BigInt(userId);
  }
}
