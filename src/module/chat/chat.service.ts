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
import { Brackets, In, Repository } from 'typeorm';
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
import { UserProfile } from '../user/entity/user.entity';
import { OfficeProfile } from '../office/entity/office.entity';
import { RolesEnum } from 'src/common/enums/roles.enum';
import { GetConversationsQueryDto } from './dto/get-conversations-query.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatConversation)
    private readonly conversationRepository: Repository<ChatConversation>,
    @InjectRepository(ChatParticipant)
    private readonly participantRepository: Repository<ChatParticipant>,
    @InjectRepository(ChatMessage)
    private readonly messageRepository: Repository<ChatMessage>,
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
  ) { }

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
        endingAt: new Date(booking.endingAt?.getTime() + 10 * 24 * 60 * 60 * 1000),
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

  async getConversationsForUser(accountId: bigint, query?: GetConversationsQueryDto) {
    const conversations = await this.listConversationsForUser(accountId, query);
    if (!query) {
      return conversations;
    }

    return {
      data: conversations,
      total: conversations.length,
      page: query.page,
      limit: query.limit,
    };
  }

  private async listConversationsForUser(accountId: bigint, query?: GetConversationsQueryDto) {
    const officeScopeIds = await this.getOfficeScopeIds(accountId);

    // ── Step 1: Query conversations ──
    const qb = this.conversationRepository
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.participants', 'participants')
      .leftJoinAndSelect('conversation.booking', 'booking')
      .where(
        new Brackets((scopeQb) => {
          scopeQb.where('conversation.user_account_id = :accountId', { accountId });
          if (officeScopeIds.length) {
            scopeQb.orWhere('conversation.office_account_id IN (:...officeScopeIds)', { officeScopeIds });
          }
        }),
      );

    qb.andWhere(
      `EXISTS (
        SELECT 1
        FROM chat_messages cm
        WHERE cm.conversation_id = conversation.id
      )`,
    );

    qb.orderBy('conversation.createdAt', 'DESC');

    // DB-level pagination
    if (query) {
      qb.skip(query.skip).take(query.limit);
    }

    const conversations = await qb.getMany();
    if (!conversations.length) {
      return [];
    }

    const conversationIds = conversations.map((c) => c.id);

    // ── Step 2: Batch sync office participants ──
    await this.batchSyncOfficeParticipants(conversations);

    // ── Step 3: Batch ensure current user is a participant ──
    await this.batchEnsureParticipantRows(conversationIds, accountId);

    // ── Step 4: Batch fetch latest offers (replaces N findActiveOfferOrThrow calls) ──
    const offerMap = await this.batchFindLatestOffers(conversations);

    // ── Step 5: Batch fetch latest messages (already efficient) ──
    const latestMessages = await this.messageRepository
      .createQueryBuilder('message')
      .innerJoin(
        (sub) =>
          sub
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

    const latestMessageMap = new Map(
      latestMessages.map((m) => [m.conversationId.toString(), m]),
    );

    // ── Step 6: Batch fetch participant rows for current user ──
    const participantRows = await this.participantRepository.find({
      where: { accountId, conversationId: In(conversationIds) },
    });
    const participantMap = new Map(
      participantRows.map((p) => [p.conversationId.toString(), p]),
    );

    // ── Step 7: Batch count unread messages (replaces N count queries) ──
    const unreadCountMap = await this.batchCountUnread(conversationIds, accountId, participantMap);

    // ── Step 8: Batch fetch office & user profiles ──
    const uniqueOfficeAccountIds = [...new Set(conversations.map((c) => c.officeAccountId))];
    const uniqueUserAccountIds = [...new Set(conversations.map((c) => c.userAccountId))];

    const [officeProfiles, userProfiles] = await Promise.all([
      Promise.all(uniqueOfficeAccountIds.map((id) => this.officeService.findByAccountId(id))),
      this.userProfileRepository.find({
        where: { accountId: In(uniqueUserAccountIds) },
        select: ['accountId', 'name'],
      }),
    ]);

    const officeProfileMap = new Map(
      uniqueOfficeAccountIds.map((id, idx) => [id.toString(), officeProfiles[idx]]),
    );
    const userProfileMap = new Map(
      userProfiles.map((p) => [p.accountId.toString(), p]),
    );

    // ── Step 9: Map response ──
    let results = conversations.map((conversation) => {
      const me = participantMap.get(conversation.id.toString());
      const officeProfile = officeProfileMap.get(conversation.officeAccountId.toString());
      const userProfile = userProfileMap.get(conversation.userAccountId.toString());
      const latestOffer = offerMap.get(conversation.id.toString());

      // Online status for participants
      const participantIds = conversation.participants.map((p) => p.accountId.toString());
      const onlineStatus = this.onlineStatusService.getOnlineStatus(participantIds);

      const bookingStatus = latestOffer?.booking?.status;
      let isEnded = false;
      if (
        (bookingStatus === BookingStatus.UNDER_NEGOTIATION ||
          bookingStatus === BookingStatus.CANCELLED)
        && latestOffer?.offerDuration && latestOffer.offerDuration < new Date()) {
        isEnded = true;
      } else if ((bookingStatus === BookingStatus.CONFIRMED 
        || bookingStatus === BookingStatus.COMPLETED) 
        && latestOffer?.booking?.endingAt && latestOffer.booking.endingAt < new Date()) {
        isEnded = true;
      }

      return {
        ...conversation,
        participants: undefined,
        id: Number(conversation.id),
        bookingId: Number(conversation.bookingId),
        userAccountId: Number(conversation.userAccountId),
        officeAccountId: Number(conversation.officeAccountId),
        createdByAccountId: Number(conversation.createdByAccountId),
        offerId: latestOffer ? Number(latestOffer.id) : null,
        booking: {
          bookingId: Number(conversation.bookingId),
          bookingType: latestOffer?.booking?.type,
          bookingStatus,
          activeOfferId: latestOffer ? Number(latestOffer.id) : null,
        },
        isEnded,
        userName: userProfile?.name ?? null,
        officeName: officeProfile?.officeName ?? null,
        logoUrl: officeProfile?.logoUrl ?? null,
        lastOfferDuration: latestOffer?.offerDuration ?? null,
        unreadCount: unreadCountMap.get(conversation.id.toString()) ?? 0,
        latestMessage: latestMessageMap.get(conversation.id.toString()) ?? null,
        myLastReadMessageId: me?.lastReadMessageId ?? null,
        myLastReadAt: me?.lastReadAt ?? null,
      };
    });

    // ── Step 10: Apply isEnded filter if specified ──
    if (query?.isEnded) {
      results = results.filter((r) => {
        if (query.isEnded === 'true') {
          return r.isEnded === true;
        } else {
          return r.isEnded === false;
        }
      });
    }

    return results;
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

    const bookingStatus = activeOffer.booking.status;
    let isEnded = false;
    if (
      (bookingStatus === BookingStatus.UNDER_NEGOTIATION ||
        bookingStatus === BookingStatus.CANCELLED)
      && activeOffer.offerDuration && activeOffer.offerDuration < new Date()) {
      isEnded = true;
    } else if ((bookingStatus === BookingStatus.CONFIRMED 
      || bookingStatus === BookingStatus.COMPLETED) 
      && activeOffer.booking.endingAt && activeOffer.booking.endingAt < new Date()) {
      isEnded = true;
    }

    return {
      ...hydratedConversation,
      id: Number(hydratedConversation.id),
      bookingId: Number(hydratedConversation.bookingId),
      userAccountId: Number(hydratedConversation.userAccountId),
      officeAccountId: Number(hydratedConversation.officeAccountId),
      createdByAccountId: Number(hydratedConversation.createdByAccountId),
      offerId: Number(activeOffer.id),
      booking: {
        bookingId: Number(hydratedConversation.bookingId),
        bookingType: activeOffer.booking.type,
        bookingStatus,
        activeOfferId: Number(activeOffer.id),
      },
      isEnded,
      userName: userProfile?.name ?? null,
      officeName: officeProfile?.officeName ?? null,
      logoUrl: officeProfile?.logoUrl ?? null,
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
        closedStatuses: [BookingStatus.CANCELLED],
      })
      .orderBy('offer.updatedAt', 'DESC')
      .getOne();

    if (!offer) {
      // If no active offer, return the last offer regardless of status/duration
      const lastOffer = await this.offerRepository
        .createQueryBuilder('offer')
        .leftJoinAndSelect('offer.booking', 'booking')
        .leftJoinAndSelect('booking.user', 'bookingUser')
        .leftJoinAndSelect('offer.office', 'office')
        .where('booking.id = :bookingId', { bookingId })
        .andWhere('office.accountId = :officeAccountId', { officeAccountId })
        .orderBy('offer.updatedAt', 'DESC')
        .getOne();

      if (!lastOffer) {
        throw new ForbiddenException(
          'No active offer exists between this booking and office, or the offer time has finished',
        );
      }

      return lastOffer;
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

  // ═══════════════════════════════════════════════
  // ══  Batch helpers (used by listConversationsForUser)
  // ═══════════════════════════════════════════════

  /**
   * Single query to get the latest offer per conversation.
   * Uses a subquery with MAX(updatedAt) grouped by (booking_id, office_account_id)
   * to avoid the N+1 findActiveOfferOrThrow calls.
   */
  private async batchFindLatestOffers(
    conversations: ChatConversation[],
  ): Promise<Map<string, Offer>> {
    if (!conversations.length) return new Map();

    const pairs = conversations.map((c) => ({
      bookingId: c.bookingId,
      officeAccountId: c.officeAccountId,
      conversationId: c.id,
    }));

    const bookingIds = [...new Set(pairs.map((p) => p.bookingId))];
    const officeAccountIds = [...new Set(pairs.map((p) => p.officeAccountId))];

    // Fetch all candidate offers in one query
    const offers = await this.offerRepository
      .createQueryBuilder('offer')
      .leftJoinAndSelect('offer.booking', 'booking')
      .leftJoinAndSelect('booking.user', 'bookingUser')
      .leftJoinAndSelect('offer.office', 'office')
      .where('booking.id IN (:...bookingIds)', { bookingIds })
      .andWhere('office.accountId IN (:...officeAccountIds)', { officeAccountIds })
      .orderBy('offer.updatedAt', 'DESC')
      .getMany();

    // Group by "bookingId|officeAccountId" and pick the best offer per group
    const grouped = new Map<string, Offer>();
    for (const offer of offers) {
      const key = `${offer.booking.id}|${offer.office.accountId}`;
      if (!grouped.has(key)) {
        grouped.set(key, offer); // already sorted DESC by updatedAt
      }
    }

    // Map back to conversationId
    const result = new Map<string, Offer>();
    for (const pair of pairs) {
      const key = `${pair.bookingId}|${pair.officeAccountId}`;
      const offer = grouped.get(key);
      if (offer) {
        result.set(pair.conversationId.toString(), offer);
      }
    }

    return result;
  }

  /**
   * Batch sync office participants for all conversations in one pass.
   * Replaces N individual syncOfficeParticipants calls.
   */
  private async batchSyncOfficeParticipants(conversations: ChatConversation[]): Promise<void> {
    if (!conversations.length) return;

    const uniqueOfficeAccountIds = [...new Set(conversations.map((c) => c.officeAccountId))];

    // Single query: get all active employees for all offices
    const allEmployees = await this.officeEmployeeRepository.find({
      where: {
        office: { accountId: In(uniqueOfficeAccountIds) },
        isActive: true,
      },
      relations: ['office'],
      select: ['accountId', 'office'],
    });

    // Group employees by office accountId
    const employeesByOffice = new Map<string, Set<string>>();
    for (const emp of allEmployees) {
      const officeId = emp.office?.accountId?.toString();
      if (!officeId || !emp.accountId) continue;
      if (!employeesByOffice.has(officeId)) {
        employeesByOffice.set(officeId, new Set());
      }
      employeesByOffice.get(officeId)!.add(emp.accountId.toString());
    }

    // Build required participant sets per conversation
    const allRequired: { conversationId: bigint; accountId: bigint }[] = [];
    for (const conversation of conversations) {
      const officeId = conversation.officeAccountId.toString();
      const requiredIds = new Set<string>([officeId]);
      const employees = employeesByOffice.get(officeId);
      if (employees) {
        for (const empId of employees) {
          requiredIds.add(empId);
        }
      }
      for (const id of requiredIds) {
        allRequired.push({ conversationId: conversation.id, accountId: BigInt(id) });
      }
    }

    if (!allRequired.length) return;

    // Single query: get all existing participant rows for these conversations
    const conversationIds = conversations.map((c) => c.id);
    const existingParticipants = await this.participantRepository.find({
      where: { conversationId: In(conversationIds) },
      select: ['conversationId', 'accountId'],
    });

    const existingSet = new Set(
      existingParticipants.map((p) => `${p.conversationId}|${p.accountId}`),
    );

    const missing = allRequired.filter(
      (r) => !existingSet.has(`${r.conversationId}|${r.accountId}`),
    );

    if (missing.length) {
      await this.participantRepository.save(
        missing.map((m) =>
          this.participantRepository.create({
            conversationId: m.conversationId,
            accountId: m.accountId,
          }),
        ),
      );
    }
  }

  /**
   * Batch ensure the current user is a participant in all given conversations.
   * Replaces N individual ensureParticipantRow calls.
   */
  private async batchEnsureParticipantRows(conversationIds: bigint[], accountId: bigint): Promise<void> {
    if (!conversationIds.length) return;

    const existing = await this.participantRepository.find({
      where: { accountId, conversationId: In(conversationIds) },
      select: ['conversationId'],
    });

    const existingConvIds = new Set(existing.map((p) => p.conversationId.toString()));
    const missingConvIds = conversationIds.filter((id) => !existingConvIds.has(id.toString()));

    if (missingConvIds.length) {
      await this.participantRepository.save(
        missingConvIds.map((convId) =>
          this.participantRepository.create({ conversationId: convId, accountId }),
        ),
      );
    }
  }

  /**
   * Single aggregated query to count unread messages for all conversations.
   * Replaces N individual count queries.
   */
  private async batchCountUnread(
    conversationIds: bigint[],
    accountId: bigint,
    participantMap: Map<string, ChatParticipant>,
  ): Promise<Map<string, number>> {
    if (!conversationIds.length) return new Map();

    // We need different lastReadAt per conversation, so we use a CASE WHEN approach
    // For simplicity and correctness, use raw query with per-conversation filters
    const qb = this.messageRepository
      .createQueryBuilder('message')
      .select('message.conversation_id', 'conv_id')
      .addSelect('COUNT(*)', 'unread_count')
      .where('message.conversation_id IN (:...conversationIds)', { conversationIds })
      .andWhere('message.sender_account_id != :accountId', { accountId })
      .groupBy('message.conversation_id');

    // Get the earliest lastReadAt among all conversations to pre-filter
    const lastReadDates: Date[] = [];
    for (const [, participant] of participantMap) {
      if (participant.lastReadAt) {
        lastReadDates.push(participant.lastReadAt);
      }
    }

    // If all conversations have been read, use the earliest date as a baseline filter
    if (lastReadDates.length > 0) {
      const earliestRead = new Date(Math.min(...lastReadDates.map((d) => d.getTime())));
      qb.andWhere('message.created_at > :earliestRead', { earliestRead });
    }

    const rawResults: { conv_id: string; unread_count: string }[] = await qb.getRawMany();

    // Build initial counts from the aggregated query
    const countMap = new Map<string, number>();
    for (const row of rawResults) {
      countMap.set(row.conv_id.toString(), parseInt(row.unread_count, 10));
    }

    // If participants have varying lastReadAt, we need per-conversation refinement
    // The aggregated query used the earliest lastReadAt, so for conversations with
    // a later lastReadAt, we may have overcounted. Refine those.
    if (lastReadDates.length > 0 && lastReadDates.length < conversationIds.length) {
      // Some conversations have no lastReadAt (never read) — their count from
      // the aggregated query is an undercount. Re-query those without date filter.
      const neverReadConvIds = conversationIds.filter(
        (id) => !participantMap.get(id.toString())?.lastReadAt,
      );

      if (neverReadConvIds.length) {
        const neverReadResults: { conv_id: string; unread_count: string }[] = await this.messageRepository
          .createQueryBuilder('message')
          .select('message.conversation_id', 'conv_id')
          .addSelect('COUNT(*)', 'unread_count')
          .where('message.conversation_id IN (:...neverReadConvIds)', { neverReadConvIds })
          .andWhere('message.sender_account_id != :accountId', { accountId })
          .groupBy('message.conversation_id')
          .getRawMany();

        for (const row of neverReadResults) {
          countMap.set(row.conv_id.toString(), parseInt(row.unread_count, 10));
        }
      }

      // For conversations with a later lastReadAt than the earliest, refine
      const refinementIds = conversationIds.filter((id) => {
        const p = participantMap.get(id.toString());
        if (!p?.lastReadAt) return false;
        const earliest = new Date(Math.min(...lastReadDates.map((d) => d.getTime())));
        return p.lastReadAt.getTime() > earliest.getTime();
      });

      for (const convId of refinementIds) {
        const lastReadAt = participantMap.get(convId.toString())!.lastReadAt;
        const count = await this.messageRepository
          .createQueryBuilder('message')
          .where('message.conversation_id = :convId', { convId })
          .andWhere('message.sender_account_id != :accountId', { accountId })
          .andWhere('message.created_at > :lastReadAt', { lastReadAt })
          .getCount();
        countMap.set(convId.toString(), count);
      }
    }

    return countMap;
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

  private isEndedBookingStatus(status: BookingStatus): boolean {
    return (
      status === BookingStatus.COMPLETED ||
      status === BookingStatus.CANCELLED
    );
  }
}
