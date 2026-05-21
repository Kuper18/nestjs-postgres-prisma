import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

const PARTICIPANT_USER_SELECT = {
  user: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  },
} as const;

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async createDirect(userId: string, recipientId: string) {
    if (userId === recipientId) {
      throw new BadRequestException('Cannot create a chat with yourself.');
    }

    const directKey = [userId, recipientId].sort().join(':');

    const existing = await this.prisma.chat.findUnique({
      where: { directKey },
      include: { participants: true },
    });

    if (existing) return existing;

    try {
      return await this.prisma.chat.create({
        data: {
          type: 'DIRECT',
          directKey,
          participants: {
            create: [{ userId }, { userId: recipientId }],
          },
        },
        include: { participants: true },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const chat = await this.prisma.chat.findUnique({
          where: { directKey },
          include: { participants: true },
        });
        if (chat) return chat;
      }
      throw error;
    }
  }

  async findAllForUser(userId: string) {
    const chats = await this.prisma.chat.findMany({
      where: { participants: { some: { userId } } },
      include: {
        participants: { include: PARTICIPANT_USER_SELECT },
        messages: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return Promise.all(
      chats.map(async (chat) => {
        const me = chat.participants.find((p) => p.userId === userId);
        const unread = await this.computeUnread(
          chat.id,
          userId,
          me?.lastReadAt ?? null,
        );
        return { ...chat, ...unread };
      }),
    );
  }

  async findById(chatId: string, userId: string) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        participants: { include: PARTICIPANT_USER_SELECT },
      },
    });

    if (!chat) throw new NotFoundException('Chat not found.');

    const isMember = chat.participants.some((p) => p.userId === userId);
    if (!isMember) throw new ForbiddenException('Access denied.');

    return chat;
  }

  async getChatDetail(chatId: string, userId: string) {
    const chat = await this.findById(chatId, userId);
    const me = chat.participants.find((p) => p.userId === userId);
    const unread = await this.computeUnread(
      chatId,
      userId,
      me?.lastReadAt ?? null,
    );
    return { ...chat, ...unread };
  }

  private async computeUnread(
    chatId: string,
    userId: string,
    lastReadAt: Date | null,
  ) {
    const where = {
      chatId,
      deletedAt: null,
      senderId: { not: userId },
      ...(lastReadAt ? { createdAt: { gt: lastReadAt } } : {}),
    };

    const [unreadCount, firstUnread] = await Promise.all([
      this.prisma.message.count({ where }),
      this.prisma.message.findFirst({
        where,
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        select: { id: true },
      }),
    ]);

    return { unreadCount, firstUnreadMessageId: firstUnread?.id ?? null };
  }
}
