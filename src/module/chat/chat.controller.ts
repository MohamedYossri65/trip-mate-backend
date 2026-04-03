import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/auth.guard';
import { CurrentUser } from 'src/common/guards/decorators/user.decorator';
import { Account } from '../account/entity/account.entity';
import { ChatService } from './chat.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { GetMessagesQueryDto } from './dto/get-messages-query.dto';
import { GetConversationsQueryDto } from './dto/get-conversations-query.dto';

@ApiTags('chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'conversations', version: '1' })
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  @ApiOperation({ summary: 'Get all conversations for current user' })
  async getConversations(
    @CurrentUser() account: Account,
    @Query() query: GetConversationsQueryDto,
  ) {
    return this.chatService.getConversationsForUser(account.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get conversation details by id' })
  async getConversationById(
    @CurrentUser() account: Account,
    @Param('id') conversationId: string,
  ) {
    return this.chatService.getConversationById(account.id, conversationId);
  }

  @Post()
  @ApiOperation({ summary: 'Create direct conversation for booking + office' })
  async createConversation(
    @CurrentUser() account: Account,
    @Body() dto: CreateConversationDto,
  ) {
    return this.chatService.createConversation(account.id, dto);
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Get paginated messages for a conversation' })
  async getMessages(
    @CurrentUser() account: Account,
    @Param('id') conversationId: string,
    @Query() query: GetMessagesQueryDto,
  ) {
    return this.chatService.getMessages(account.id, conversationId, query);
  }
}
