import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatConversation } from './entities/chat-conversation.entity';
import { ChatParticipant } from './entities/chat-participant.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { In, Repository } from 'typeorm';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { ConversationType, MessageType } from './enums/chat.enums';
import { Account } from '../account/entity/account.entity';
import { SendMessageDto } from './dto/send-message.dto';
import { GetMessagesQueryDto } from './dto/get-messages-query.dto';
import { MarkAsReadDto } from './dto/mark-as-read.dto';
import { Offer } from '../offers/entity/offer.entity';
import { OfferStatus } from '../offers/enum/offer-status.enum';
import { BookingStatus } from '../bookings/domain/enum/booking-status.enum';
import { OfficeEmployee } from '../office/entity/employee.entity';
import { OfficeService } from '../office/office.service';
import { OnlineStatusService } from './services/online-status.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { UserProfile } from '../user/entity/user.entity';
import { OfficeProfile } from '../office/entity/office.entity';
import { RolesEnum } from 'src/common/enums/roles.enum';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatConversation)
    private readonly conversationRepository: Repository<ChatConversation>,
    @InjectRepository(ChatParticipant)
    private readonly participantRepository: Repository<ChatParticipant>,
    @InjectRepository(ChatMessage)
    private readonly messageRepository: Repository<ChatMessage>,
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    @InjectRepository(Offer)
    private readonly offerRepository: Repository<Offer>,
    @InjectRepository(OfficeEmployee)
    private readonly officeEmployeeRepository: Repository<OfficeEmployee>,
    @InjectRepository(UserProfile)
    private readonly userProfileRepository: Repository<UserProfile>,
    @InjectRepository(OfficeProfile)
    private readonly officeProfileRepository: Repository<OfficeProfile>,
    private readonly officeService: OfficeService,
    private readonly onlineStatusService: OnlineStatusService,
  ) {}

  async createConversation(requesterId: bigint, dto: CreateConversationDto) {
    const bookingId = this.toBigInt(dto.bookingId, 'bookingId');
    const officeAccountId = this.toBigInt(dto.officeAccountId, 'officeAccountId');

    const activeOffer = await this.findActiveOfferOrThrow(bookingId, officeAccountId);
    const booking = activeOffer.booking;
    const userAccountId = booking.user.accountId;

    const requesterRole = await this.resolveRequesterRoleForConversation(requesterId, userAccountId, officeAccountId);
    if (requesterRole === 'none') {
      throw new ForbiddenException('Only the booking user or office team can create this conversation');
    }

    const existingDirect = await this.conversationRepository.findOne({
      where: {
        bookingId,
        userAccountId,
        officeAccountId,
      },
    });

    if (existingDirect) {
      await this.syncOfficeParticipants(existingDirect.id, officeAccountId);
      await this.ensureParticipantRow(existingDirect.id, requesterId);
      return this.getConversationById(requesterId, existingDirect.id.toString());
    }

    const createdConversation = await this.conversationRepository.manager.transaction(async (manager) => {
      const conversation = manager.getRepository(ChatConversation).create({
        type: ConversationType.DIRECT,
        bookingId,
        userAccountId,
        officeAccountId,
        createdByAccountId: requesterId,
      });

      const savedConversation = await manager.getRepository(ChatConversation).save(conversation);
      const participants = await this.buildDefaultParticipants(savedConversation.id, userAccountId, officeAccountId);

      await manager.getRepository(ChatParticipant).save(
        participants.map((accountId) =>
          manager.getRepository(ChatParticipant).create({
            conversationId: savedConversation.id,
            accountId,
          }),
        ),
      );

      return savedConversation;
    });

    await this.ensureParticipantRow(createdConversation.id, requesterId);
    return this.getConversationById(requesterId, createdConversation.id.toString());
  }

  async getConversationsForUser(accountId: bigint, query?: PaginationDto) {
    const conversations = await this.listConversationsForUser(accountId);

    if (!query) {
      return conversations;
    }

    const total = conversations.length;
    const data = conversations.slice(query.skip, query.skip + query.limit);

    return {
      data,
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  private async listConversationsForUser(accountId: bigint) {
    const officeScopeIds = await this.getOfficeScopeIds(accountId);
    const qb = this.conversationRepository
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.participants', 'participants')
      .where('conversation.user_account_id = :accountId', { accountId });

    if (officeScopeIds.length) {
      qb.orWhere('conversation.office_account_id IN (:...officeScopeIds)', { officeScopeIds });
    }

    qb.orderBy('conversation.created_at', 'DESC');

    const conversations = await qb.getMany();
    const activeConversations: ChatConversation[] = [];
    for (const conversation of conversations) {
      const isActive = await this.isConversationActive(conversation);
      if (!isActive) {
        continue;
      }
      await this.syncOfficeParticipants(conversation.id, conversation.officeAccountId);
      await this.ensureParticipantRow(conversation.id, accountId);
      activeConversations.push(conversation);
    }

    const conversationIds = activeConversations.map((conversation) => conversation.id);
    if (!conversationIds.length) {
      return [];
    }

    const latestMessages = await this.messageRepository
      .createQueryBuilder('message')
      .innerJoin(
        (qb) =>
          qb
            .select('m.conversation_id', 'conv_id')
            .addSelect('MAX(m.created_at)', 'latest_ts')
            .from(ChatMessage, 'm')
            .where('m.conversation_id IN (:...conversationIds)', { conversationIds })
            .groupBy('m.conversation_id'),
        'latest',
        'latest.conv_id = message.conversation_id AND latest.latest_ts = message.created_at',
      )
      .leftJoinAndSelect('message.sender', 'sender')
      .getMany();

    await this.enrichMessagesWithSenderNames(latestMessages);

    const latestMessageByConversation = new Map(
      latestMessages.map((message) => [message.conversationId.toString(), message]),
    );

    const conversationsWithMessages = activeConversations.filter((conversation) =>
      latestMessageByConversation.has(conversation.id.toString()),
    );

    const activeOfferEntries = await Promise.all(
      conversationsWithMessages.map(async (conversation) => {
        const activeOffer = await this.findActiveOfferOrThrow(
          conversation.bookingId,
          conversation.officeAccountId,
        );

        return [conversation.id.toString(), activeOffer] as const;
      }),
    );

    const activeOfferMap = new Map(activeOfferEntries);

    const participantRows = await this.participantRepository.find({
      where: { accountId, conversationId: In(conversationIds) },
    });
    const participantMap = new Map(
      participantRows.map((participant) => [participant.conversationId.toString(), participant]),
    );

    // Batch-fetch office profiles for all conversations
    const uniqueOfficeAccountIds = [...new Set(conversationsWithMessages.map((c) => c.officeAccountId))];
    const uniqueUserAccountIds = [...new Set(conversationsWithMessages.map((c) => c.userAccountId))];

    const [officeProfiles, userProfiles] = await Promise.all([
      Promise.all(uniqueOfficeAccountIds.map((id) => this.officeService.findByAccountId(id))),
      this.userProfileRepository.find({
        where: { accountId: In(uniqueUserAccountIds) },
        select: ['accountId', 'name'],
      }),
    ]);

    const officeProfileMap = new Map(
      uniqueOfficeAccountIds.map((id, index) => [id.toString(), officeProfiles[index]]),
    );
    const userProfileMap = new Map(
      userProfiles.map((profile) => [profile.accountId.toString(), profile]),
    );

    // Batch-count unread messages per conversation
    const unreadCountMap = new Map<string, number>();
    for (const conversation of conversationsWithMessages) {
      const me = participantMap.get(conversation.id.toString());
      const qb = this.messageRepository
        .createQueryBuilder('message')
        .where('message.conversation_id = :conversationId', { conversationId: conversation.id })
        .andWhere('message.sender_account_id != :accountId', { accountId });

      if (me?.lastReadAt) {
        qb.andWhere('message.created_at > :lastReadAt', { lastReadAt: me.lastReadAt });
      }

      const count = await qb.getCount();
      unreadCountMap.set(conversation.id.toString(), count);
    }

    const offerDurationEntries = activeOfferEntries.map(([conversationId, activeOffer]) => [
      conversationId,
      activeOffer.offerDuration ?? null,
    ] as const);
    const offerDurationMap = new Map<string, Date | null>(offerDurationEntries);

    return conversationsWithMessages.map((conversation) => {
      const me = participantMap.get(conversation.id.toString());
      const officeProfile = officeProfileMap.get(conversation.officeAccountId.toString());
      const userProfile = userProfileMap.get(conversation.userAccountId.toString());
      const activeOffer = activeOfferMap.get(conversation.id.toString());
      
      // Get active status for all participants
      const participantIds = conversation.participants.map((p) => p.accountId.toString());
      const onlineStatus = this.onlineStatusService.getOnlineStatus(participantIds);
      const participantsWithStatus = conversation.participants.map((p) => ({
        ...p,
        isActive: onlineStatus.get(p.accountId.toString()) ?? false,
      }));
      
      return {
        ...conversation,
        booking: {
          bookingId: conversation.bookingId,
          bookingType: activeOffer!.booking.type,
          activeOfferId: activeOffer!.id,
        },
        userName: userProfile?.name ?? null,
        officeName: officeProfile?.officeName ?? null,
        officeLogo: officeProfile?.logoUrl ?? null,
        lastOfferDuration: offerDurationMap.get(conversation.id.toString()) ?? null,
        unreadCount: unreadCountMap.get(conversation.id.toString()) ?? 0,
        participants: participantsWithStatus,
        latestMessage: latestMessageByConversation.get(conversation.id.toString()) ?? null,
        myLastReadMessageId: me?.lastReadMessageId ?? null,
        myLastReadAt: me?.lastReadAt ?? null,
      };
    });
  }

  async getConversationById(accountId: bigint, conversationIdRaw: string) {
    const conversationId = this.toBigInt(conversationIdRaw, 'conversationId');
    const conversation = await this.ensureConversationAccess(conversationId, accountId);
    await this.syncOfficeParticipants(conversation.id, conversation.officeAccountId);
    await this.ensureParticipantRow(conversation.id, accountId);

    const hydratedConversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
      relations: {
        participants: {
          account: true,
        },
      },
    });

    if (!hydratedConversation) {
      throw new NotFoundException('Conversation not found');
    }

    const [latestMessage, officeProfile, activeOffer] = await Promise.all([
      this.messageRepository.findOne({
        where: { conversationId },
        order: { createdAt: 'DESC' },
        relations: { sender: true },
      }),
      this.officeService.findByAccountId(hydratedConversation.officeAccountId),
      this.findActiveOfferOrThrow(hydratedConversation.bookingId, hydratedConversation.officeAccountId),
    ]);

    const userProfile = await this.userProfileRepository.findOne({
      where: { accountId: hydratedConversation.userAccountId },
      select: ['accountId', 'name'],
    });

    if (latestMessage) {
      await this.enrichMessagesWithSenderNames([latestMessage]);
    }

    // Get active status for all participants
    const participantIds = hydratedConversation.participants.map((p) => p.accountId.toString());
    const onlineStatus = this.onlineStatusService.getOnlineStatus(participantIds);

    const participantsWithStatus = hydratedConversation.participants.map((p) => ({
      ...p,
      isActive: onlineStatus.get(p.accountId.toString()) ?? false,
    }));

    return {
      ...hydratedConversation,
      booking: {
        bookingId: hydratedConversation.bookingId,
        bookingType: activeOffer.booking.type,
        activeOfferId: activeOffer.id,
      },
      userName: userProfile?.name ?? null,
      officeName: officeProfile?.officeName ?? null,
      officeLogo: officeProfile?.logoUrl ?? null,
      lastOfferDuration: activeOffer.offerDuration ?? null,
      participants: participantsWithStatus,
      latestMessage,
    };
  }

  async getMessages(accountId: bigint, conversationIdRaw: string, query: GetMessagesQueryDto) {
    const conversationId = this.toBigInt(conversationIdRaw, 'conversationId');
    const conversation = await this.ensureConversationAccess(conversationId, accountId);
    await this.syncOfficeParticipants(conversation.id, conversation.officeAccountId);
    await this.ensureParticipantRow(conversation.id, accountId);

    const [messages, total] = await this.messageRepository.findAndCount({
      where: { conversationId },
      relations: { sender: true },
      order: { createdAt: 'DESC' },
      skip: query.skip,
      take: query.limit,
    });

    await this.enrichMessagesWithSenderNames(messages);

    return {
      data: messages,
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  async sendMessage(senderAccountId: bigint, dto: SendMessageDto) {
    const conversationId = this.toBigInt(dto.conversationId, 'conversationId');
    const conversation = await this.ensureConversationAccess(conversationId, senderAccountId);
    await this.syncOfficeParticipants(conversation.id, conversation.officeAccountId);
    await this.ensureParticipantRow(conversation.id, senderAccountId);

    const messageType = dto.type ?? (dto.attachmentUrl ? MessageType.ATTACHMENT : MessageType.TEXT);
    const isOfferMessage = messageType === MessageType.OFFER;

    if (!isOfferMessage && !dto.content && !dto.attachmentUrl) {
      throw new BadRequestException('Either content or attachmentUrl is required');
    }

    if (isOfferMessage && !dto.offerDetails) {
      throw new BadRequestException('offerDetails is required for OFFER messages');
    }

    if (!isOfferMessage && dto.offerDetails) {
      throw new BadRequestException('offerDetails is only allowed for OFFER messages');
    }

    if (messageType === MessageType.AUDIO && !dto.audioDurationSec) {
      throw new BadRequestException('audioDurationSec is required for AUDIO messages');
    }

    const message = this.messageRepository.create({
      conversationId,
      senderAccountId,
      content: dto.content,
      attachmentUrl: dto.attachmentUrl,
      type: messageType,
      audioDurationSec: messageType === MessageType.AUDIO ? dto.audioDurationSec : undefined,
      offerDetails: isOfferMessage ? dto.offerDetails : undefined,
    });

    const savedMessage = await this.messageRepository.save(message);
    const result = await this.messageRepository.findOne({
      where: { id: savedMessage.id },
      relations: { sender: true },
    });

    if (result) {
      await this.enrichMessagesWithSenderNames([result]);
    }

    return result;
  }

  async markAsRead(accountId: bigint, dto: MarkAsReadDto) {
    const conversationId = this.toBigInt(dto.conversationId, 'conversationId');
    const conversation = await this.ensureConversationAccess(conversationId, accountId);
    await this.syncOfficeParticipants(conversation.id, conversation.officeAccountId);
    const participant = await this.ensureParticipantRow(conversation.id, accountId);

    const latestMessage = await this.messageRepository.findOne({
      where: { conversationId },
      order: { createdAt: 'DESC' },
    });

    if (!latestMessage) {
      return {
        conversationId,
        lastReadMessageId: null,
        lastReadAt: null,
      };
    }

    participant.lastReadMessageId = latestMessage.id;
    participant.lastReadAt = new Date();
    await this.participantRepository.save(participant);

    return {
      conversationId,
      lastReadMessageId: latestMessage.id,
      lastReadAt: participant.lastReadAt,
    };
  }

  async getConversationIdsForUser(accountId: bigint): Promise<string[]> {
    const conversations = await this.listConversationsForUser(accountId);
    return conversations.map((conversation) => conversation.id.toString());
  }

  async getParticipantIds(conversationId: bigint): Promise<string[]> {
    const conversation = await this.conversationRepository.findOne({ where: { id: conversationId } });
    if (!conversation) {
      return [];
    }

    await this.syncOfficeParticipants(conversationId, conversation.officeAccountId);

    const participants = await this.participantRepository.find({
      where: { conversationId },
      select: ['accountId'],
    });

    return participants.map((p) => p.accountId.toString());
  }

  async ensureParticipant(conversationId: bigint, accountId: bigint) {
    const conversation = await this.ensureConversationAccess(conversationId, accountId);
    await this.syncOfficeParticipants(conversation.id, conversation.officeAccountId);
    return this.ensureParticipantRow(conversationId, accountId);
  }

  private async ensureConversationAccess(conversationId: bigint, accountId: bigint): Promise<ChatConversation> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const activeOffer = await this.findActiveOfferOrThrow(conversation.bookingId, conversation.officeAccountId);
    if (activeOffer.booking.user.accountId.toString() !== conversation.userAccountId.toString()) {
      throw new ForbiddenException('Conversation booking ownership mismatch');
    }

    const isUser = accountId.toString() === conversation.userAccountId.toString();
    const isOffice = await this.isInOfficeScope(accountId, conversation.officeAccountId);

    if (!isUser && !isOffice) {
      throw new Error('You are not allowed to access this conversation');
    }

    return conversation;
  }

  private async findActiveOfferOrThrow(bookingId: bigint, officeAccountId: bigint): Promise<Offer> {
    const now = new Date();
    const offer = await this.offerRepository
      .createQueryBuilder('offer')
      .leftJoinAndSelect('offer.booking', 'booking')
      .leftJoinAndSelect('booking.user', 'bookingUser')
      .leftJoinAndSelect('offer.office', 'office')
      .where('booking.id = :bookingId', { bookingId })
      .andWhere('office.accountId = :officeAccountId', { officeAccountId })
      .andWhere('offer.status NOT IN (:...blockedStatuses)', {
        blockedStatuses: [OfferStatus.REJECTED, OfferStatus.REPLACED],
      })
      .andWhere('(offer.offerDuration IS NULL OR offer.offerDuration > :now)', { now })
      .andWhere('booking.status NOT IN (:...closedStatuses)', {
        closedStatuses: [BookingStatus.COMPLETED, BookingStatus.CANCELLED],
      })
      .orderBy('offer.updatedAt', 'DESC')
      .getOne();

    if (!offer) {
      throw new ForbiddenException(
        'No active offer exists between this booking and office, or the offer time has finished',
      );
    }

    return offer;
  }

  private async resolveRequesterRoleForConversation(
    requesterId: bigint,
    userAccountId: bigint,
    officeAccountId: bigint,
  ): Promise<'user' | 'office' | 'none'> {
    if (requesterId === userAccountId) {
      return 'user';
    }

    if (await this.isInOfficeScope(requesterId, officeAccountId)) {
      return 'office';
    }

    return 'none';
  }

  private async isInOfficeScope(accountId: bigint, officeAccountId: bigint): Promise<boolean> {
    if (accountId.toString() === officeAccountId.toString()) {
      return true;
    }

    const employeeMembership = await this.officeService.findEmployeeMembershipByAccountId(accountId);
    return employeeMembership?.office?.accountId === officeAccountId;
  }

  private async getOfficeScopeIds(accountId: bigint): Promise<bigint[]> {
    const officeIds = new Set<bigint>();

    const ownOffice = await this.officeService.findByAccountId(accountId);
    if (ownOffice?.accountId) {
      officeIds.add(ownOffice.accountId);
    }

    const employeeMembership = await this.officeService.findEmployeeMembershipByAccountId(accountId);
    if (employeeMembership?.office?.accountId) {
      officeIds.add(employeeMembership.office.accountId);
    }

    return Array.from(officeIds);
  }

  private async buildDefaultParticipants(
    conversationId: bigint,
    userAccountId: bigint,
    officeAccountId: bigint,
  ): Promise<bigint[]> {
    const participants = new Set<string>([userAccountId.toString(), officeAccountId.toString()]);

    const officeEmployees = await this.officeEmployeeRepository.find({
      where: {
        office: { accountId: officeAccountId },
        isActive: true,
      },
      select: ['accountId'],
    });

    for (const employee of officeEmployees) {
      if (employee.accountId) {
        participants.add(employee.accountId.toString());
      }
    }

    return Array.from(participants).map((id) => BigInt(id));
  }

  private async syncOfficeParticipants(conversationId: bigint, officeAccountId: bigint): Promise<void> {
    const officeEmployees = await this.officeEmployeeRepository.find({
      where: {
        office: { accountId: officeAccountId },
        isActive: true,
      },
      select: ['accountId'],
    });

    const requiredParticipantIds = new Set<string>([officeAccountId.toString()]);
    for (const employee of officeEmployees) {
      if (employee.accountId) {
        requiredParticipantIds.add(employee.accountId.toString());
      }
    }

    if (!requiredParticipantIds.size) {
      return;
    }

    const existingRows = await this.participantRepository.find({
      where: {
        conversationId,
        accountId: In(Array.from(requiredParticipantIds).map((id) => BigInt(id))),
      },
      select: ['accountId'],
    });

    const existing = new Set(existingRows.map((row) => row.accountId.toString()));
    const missing = Array.from(requiredParticipantIds)
      .filter((id) => !existing.has(id))
      .map((id) => BigInt(id));

    if (!missing.length) {
      return;
    }

    await this.participantRepository.save(
      missing.map((accountId) =>
        this.participantRepository.create({
          conversationId,
          accountId,
        }),
      ),
    );
  }

  private async ensureParticipantRow(conversationId: bigint, accountId: bigint): Promise<ChatParticipant> {
    let participant = await this.participantRepository.findOne({
      where: { conversationId, accountId },
    });

    if (!participant) {
      participant = await this.participantRepository.save(
        this.participantRepository.create({ conversationId, accountId }),
      );
    }

    return participant;
  }

  private async isConversationActive(conversation: ChatConversation): Promise<boolean> {
    try {
      await this.findActiveOfferOrThrow(conversation.bookingId, conversation.officeAccountId);
      return true;
    } catch {
      return false;
    }
  }

  private stripSenderPassword(message: ChatMessage): void {
    if (message?.sender) {
      delete (message.sender as any).password;
    }
  }

  private async enrichMessagesWithSenderNames(messages: ChatMessage[]): Promise<void> {
    if (!messages.length) {
      return;
    }

    const senderIds = Array.from(
      new Set(
        messages
          .map((message) => message.sender?.id?.toString())
          .filter((id): id is string => Boolean(id)),
      ),
    );

    if (!senderIds.length) {
      return;
    }

    const senderBigInts = senderIds.map((id) => BigInt(id));
    const [userProfiles, officeProfiles, employeeProfiles] = await Promise.all([
      this.userProfileRepository.find({
        where: { accountId: In(senderBigInts) },
        select: ['accountId', 'name'],
      }),
      this.officeProfileRepository.find({
        where: { accountId: In(senderBigInts) },
        select: ['accountId', 'officeName'],
      }),
      this.officeEmployeeRepository.find({
        where: { accountId: In(senderBigInts), isActive: true },
        select: ['accountId', 'name'],
      }),
    ]);

    const userNameByAccountId = new Map(
      userProfiles.map((profile) => [profile.accountId.toString(), profile.name]),
    );
    const officeNameByAccountId = new Map(
      officeProfiles.map((profile) => [profile.accountId.toString(), profile.officeName]),
    );
    const employeeNameByAccountId = new Map(
      employeeProfiles
        .filter((profile) => profile.accountId)
        .map((profile) => [profile.accountId!.toString(), profile.name]),
    );

    for (const message of messages) {
      this.stripSenderPassword(message);

      if (!message.sender?.id) {
        continue;
      }

      const senderId = message.sender.id.toString();
      let senderName: string | null = null;

      if (message.sender.role === RolesEnum.USER) {
        senderName = userNameByAccountId.get(senderId) ?? null;
      } else if (message.sender.role === RolesEnum.OFFICE) {
        senderName =
          employeeNameByAccountId.get(senderId) ??
          officeNameByAccountId.get(senderId) ??
          null;
      }

      if (!senderName) {
        senderName =
          userNameByAccountId.get(senderId) ??
          employeeNameByAccountId.get(senderId) ??
          officeNameByAccountId.get(senderId) ??
          null;
      }

      (message.sender as any).name = senderName;
    }
  }

  private toBigInt(value: string, fieldName: string): bigint {
    try {
      return BigInt(value);
    } catch {
      throw new BadRequestException(`${fieldName} must be a valid bigint`);
    }
  }
}
