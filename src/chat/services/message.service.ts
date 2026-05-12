import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MessageStatus } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { ChatService } from './chat.service';

const DEFAULT_LIMIT = 20;

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

  async findMany(
    chatId: string,
    userId: string,
    cursor?: string,
    limit = DEFAULT_LIMIT,
  ) {
    await this.chatService.findById(chatId, userId);
    type CursorPayload = { createdAt: string; id: string };
    let cursorPayload: CursorPayload | undefined;

    if (cursor) {
      cursorPayload = JSON.parse(
        Buffer.from(cursor, 'base64').toString('utf-8'),
      ) as CursorPayload;
    }

    const messages = await this.prisma.message.findMany({
      where: {
        chatId,
        deletedAt: null,
        ...(cursorPayload && {
          OR: [
            { createdAt: { lt: new Date(cursorPayload.createdAt) } },
            {
              createdAt: new Date(cursorPayload.createdAt),
              id: { lt: cursorPayload.id },
            },
          ],
        }),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    });

    const hasMore = messages.length > limit;
    const data = hasMore ? messages.slice(0, limit) : messages;
    const last = data[data.length - 1];

    const nextCursor = hasMore
      ? Buffer.from(
          JSON.stringify({ createdAt: last.createdAt, id: last.id }),
        ).toString('base64')
      : null;

    return { data, pagination: { cursor: nextCursor, hasMore } };
  }

  async updateStatus(messageId: string, status: MessageStatus) {
    return this.prisma.message.update({
      where: { id: messageId },
      data: {
        status,
        ...(status === MessageStatus.READ && { readAt: new Date() }),
      },
    });
  }

  async markChatAsRead(chatId: string, userId: string, upToMessageId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: upToMessageId },
    });

    if (!message || message.chatId !== chatId) {
      throw new NotFoundException('Message not found in this chat.');
    }

    await this.prisma.message.updateMany({
      where: {
        chatId,
        senderId: { not: userId },
        status: { not: MessageStatus.READ },
        createdAt: { lte: message.createdAt },
        deletedAt: null,
      },
      data: { status: MessageStatus.READ, readAt: new Date() },
    });
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
}
