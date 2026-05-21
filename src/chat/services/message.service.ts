import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Message, MessageStatus, Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { GetMessagesDto } from '../dto/get-messages.dto';
import { ChatService } from './chat.service';

const DEFAULT_LIMIT = 20;

type Keyset = { createdAt: Date; id: string };

@Injectable()
export class MessageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chatService: ChatService,
  ) {}

  async create(chatId: string, senderId: string, content: string) {
    await this.chatService.findById(chatId, senderId);
    return this.prisma.message.create({
      data: { chatId, senderId, content },
    });
  }

  async findMany(chatId: string, userId: string, query: GetMessagesDto) {
    await this.chatService.findById(chatId, userId);

    const limit = query.limit ?? DEFAULT_LIMIT;
    const base: Prisma.MessageWhereInput = { chatId, deletedAt: null };
    let data: Message[];

    if (query.around) {
      const anchor = await this.prisma.message.findUnique({
        where: { id: query.around },
      });
      if (!anchor || anchor.chatId !== chatId || anchor.deletedAt) {
        throw new NotFoundException('Message not found in this chat.');
      }

      const beforeCount = Math.floor(limit / 2);
      const afterCount = limit - beforeCount - 1;
      const [older, newer] = await Promise.all([
        this.prisma.message.findMany({
          where: { ...base, OR: this.olderThan(anchor) },
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          take: beforeCount,
        }),
        this.prisma.message.findMany({
          where: { ...base, OR: this.newerThan(anchor) },
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
          take: afterCount,
        }),
      ]);
      data = [...older.reverse(), anchor, ...newer];
    } else if (query.after) {
      const cursor = this.decodeCursor(query.after);
      data = await this.prisma.message.findMany({
        where: { ...base, OR: this.newerThan(cursor) },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        take: limit,
      });
    } else {
      const where: Prisma.MessageWhereInput = query.before
        ? { ...base, OR: this.olderThan(this.decodeCursor(query.before)) }
        : base;
      const rows = await this.prisma.message.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: limit,
      });
      data = rows.reverse();
    }

    return { data, pagination: await this.buildPagination(base, data) };
  }

  async updateStatus(messageId: string, userId: string, status: MessageStatus) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) throw new NotFoundException('Message not found.');
    await this.chatService.findById(message.chatId, userId);

    return this.prisma.message.update({
      where: { id: messageId },
      data: {
        status,
        ...(status === MessageStatus.READ && { readAt: new Date() }),
      },
    });
  }

  async markChatAsRead(chatId: string, userId: string, upToMessageId: string) {
    await this.chatService.findById(chatId, userId);

    const message = await this.prisma.message.findUnique({
      where: { id: upToMessageId },
    });

    if (!message || message.chatId !== chatId) {
      throw new NotFoundException('Message not found in this chat.');
    }

    const participant = await this.prisma.chatParticipant.findUnique({
      where: { chatId_userId: { chatId, userId } },
    });

    if (
      participant?.lastReadAt &&
      participant.lastReadAt >= message.createdAt
    ) {
      return { chatId, userId, lastReadAt: participant.lastReadAt };
    }

    const updated = await this.prisma.chatParticipant.update({
      where: { chatId_userId: { chatId, userId } },
      data: { lastReadAt: message.createdAt },
    });

    return { chatId, userId, lastReadAt: updated.lastReadAt };
  }

  async softDelete(messageId: string, userId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) throw new NotFoundException('Message not found.');
    if (message.senderId !== userId)
      throw new ForbiddenException("Cannot delete another user's message.");

    await this.prisma.message.update({
      where: { id: messageId },
      data: { deletedAt: new Date() },
    });
  }

  private olderThan(c: Keyset): Prisma.MessageWhereInput[] {
    return [
      { createdAt: { lt: c.createdAt } },
      { createdAt: c.createdAt, id: { lt: c.id } },
    ];
  }

  private newerThan(c: Keyset): Prisma.MessageWhereInput[] {
    return [
      { createdAt: { gt: c.createdAt } },
      { createdAt: c.createdAt, id: { gt: c.id } },
    ];
  }

  private async buildPagination(
    base: Prisma.MessageWhereInput,
    data: Message[],
  ) {
    if (data.length === 0) {
      return {
        prevCursor: null,
        nextCursor: null,
        hasPrev: false,
        hasNext: false,
      };
    }

    const oldest = data[0];
    const newest = data[data.length - 1];
    const [olderExists, newerExists] = await Promise.all([
      this.prisma.message.findFirst({
        where: { ...base, OR: this.olderThan(oldest) },
        select: { id: true },
      }),
      this.prisma.message.findFirst({
        where: { ...base, OR: this.newerThan(newest) },
        select: { id: true },
      }),
    ]);

    return {
      prevCursor: olderExists ? this.encodeCursor(oldest) : null,
      nextCursor: newerExists ? this.encodeCursor(newest) : null,
      hasPrev: !!olderExists,
      hasNext: !!newerExists,
    };
  }

  private encodeCursor(m: Keyset): string {
    return Buffer.from(
      JSON.stringify({ createdAt: m.createdAt, id: m.id }),
    ).toString('base64');
  }

  private decodeCursor(cursor: string): Keyset {
    let payload: { createdAt: string; id: string };
    try {
      payload = JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8')) as {
        createdAt: string;
        id: string;
      };
    } catch {
      throw new BadRequestException('Invalid pagination cursor.');
    }

    const createdAt = new Date(payload.createdAt);
    if (typeof payload.id !== 'string' || Number.isNaN(createdAt.getTime())) {
      throw new BadRequestException('Invalid pagination cursor.');
    }

    return { createdAt, id: payload.id };
  }
}
