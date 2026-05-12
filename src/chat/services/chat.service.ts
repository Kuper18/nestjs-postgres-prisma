import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async createDirect(userId: string, recipientId: string) {
    if (userId === recipientId) {
      throw new BadRequestException('Cannot create a chat with yourself.');
    }

    const existing = await this.prisma.chat.findFirst({
      where: {
        type: 'DIRECT',
        AND: [
          { participants: { some: { userId } } },
          { participants: { some: { userId: recipientId } } },
        ],
      },
      include: { participants: true },
    });

    if (existing) return existing;

    return this.prisma.chat.create({
      data: {
        type: 'DIRECT',
        participants: {
          create: [{ userId }, { userId: recipientId }],
        },
      },
      include: { participants: true },
    });
  }

  async findAllForUser(userId: string) {
    return this.prisma.chat.findMany({
      where: { participants: { some: { userId } } },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        messages: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findById(chatId: string, userId: string) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!chat) throw new NotFoundException('Chat not found.');

    const isMember = chat.participants.some((p) => p.userId === userId);
    if (!isMember) throw new ForbiddenException('Access denied.');

    return chat;
  }
}
