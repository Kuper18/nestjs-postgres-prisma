import { UseFilters, UseGuards } from '@nestjs/common';
import { Throttle, seconds } from '@nestjs/throttler';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { AsyncApiReceive, AsyncApiSend } from 'nestjs-asyncapi';
import { Server, Socket } from 'socket.io';
import { JwtTokenService } from 'src/auth/providers/jwt-token.service';
import { WsExceptionsFilter } from 'src/common/filters/ws-exception.filter';
import { WsThrottlerGuard } from 'src/common/guards/ws-throttler.guard';
import { MessageStatus } from 'src/generated/prisma/client';
import { UserService } from 'src/user/user.service';
import { SendMessageWsDto } from './dto/send-message-ws.dto';
import {
  MessageNewPayload,
  MessageReadPayload,
  MessageStatusPayload,
  TypingPayload,
  UserOnlinePayload,
} from './dto/ws-payloads.dto';
import { ChatService } from './services/chat.service';
import { MessageService } from './services/message.service';

type SocketData = { userId: string; chatIds: string[] };

@UseFilters(WsExceptionsFilter)
@WebSocketGateway({ namespace: '/chat' })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtTokenService: JwtTokenService,
    private readonly userService: UserService,
    private readonly chatService: ChatService,
    private readonly messageService: MessageService,
  ) {}

  @AsyncApiReceive({
    channel: 'user.online',
    summary: 'Broadcast: a participant came online or went offline',
    description:
      "`isOnline: true` fires when the user's first socket connects; `false` when the last socket disconnects (handles multiple tabs).",
    message: { name: 'UserOnlinePayload', payload: UserOnlinePayload },
  })
  async handleConnection(client: Socket) {
    const cookieHeader = client.handshake.headers.cookie ?? '';
    const token = /(?:^|;\s*)accessToken=([^;]*)/.exec(cookieHeader)?.[1];

    if (!token) {
      client.disconnect(true);
      return;
    }

    try {
      const payload = await this.jwtTokenService.verifyToken(token);
      const user = await this.userService.findById(payload.id);

      if (!user.isVerified) {
        client.disconnect(true);
        return;
      }

      const chats = await this.chatService.findAllForUser(user.id);
      const chatIds = chats.map((chat) => chat.id);

      const data = client.data as SocketData;
      data.userId = user.id;
      data.chatIds = chatIds;

      await client.join(`user:${user.id}`);
      for (const chatId of chatIds) {
        await client.join(`chat:${chatId}`);
      }

      const sockets = await this.server.in(`user:${user.id}`).fetchSockets();
      if (sockets.length === 1) {
        this.broadcastPresence(chatIds, user.id, true);
      }
    } catch {
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: Socket) {
    const { userId, chatIds } = client.data as Partial<SocketData>;
    if (!userId) return;

    const sockets = await this.server.in(`user:${userId}`).fetchSockets();
    if (sockets.length > 0) return;

    this.broadcastPresence(chatIds ?? [], userId, false);
  }

  addParticipantsToChatRoom(chatId: string, userIds: string[]): Promise<void> {
    const room = `chat:${chatId}`;
    for (const userId of userIds) {
      this.server.in(`user:${userId}`).socketsJoin(room);
    }
    return Promise.resolve();
  }

  @AsyncApiSend({
    channel: 'message.send',
    summary: 'Send a new message to a conversation',
    description: 'Rate limit: 30 messages per 10 seconds.',
    message: { name: 'SendMessageWsDto', payload: SendMessageWsDto },
  })
  @AsyncApiReceive({
    channel: 'message.new',
    summary: 'Broadcast: new message received',
    description:
      'Emitted to every participant in the chat room after a message is created.',
    message: { name: 'MessageNewPayload', payload: MessageNewPayload },
  })
  @Throttle({ default: { limit: 30, ttl: seconds(10) } })
  @UseGuards(WsThrottlerGuard)
  @SubscribeMessage('message.send')
  async handleMessageSend(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SendMessageWsDto,
  ) {
    const { userId } = client.data as SocketData;
    const message = await this.messageService.create(
      data.conversationId,
      userId,
      data.content,
    );
    this.server.to(`chat:${data.conversationId}`).emit('message.new', message);
  }

  @AsyncApiSend({
    channel: 'message.delivered',
    summary: 'Notify that a message was delivered to the client device',
    message: {
      name: 'MessageDeliveredInput',
      payload: class {
        messageId: string;
      },
    },
  })
  @AsyncApiReceive({
    channel: 'message.status',
    summary: 'Broadcast: message status changed',
    description:
      'Emitted to every participant in the chat room when a status update occurs.',
    message: { name: 'MessageStatusPayload', payload: MessageStatusPayload },
  })
  @SubscribeMessage('message.delivered')
  async handleMessageDelivered(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string },
  ) {
    const { userId } = client.data as SocketData;
    const message = await this.messageService.updateStatus(
      data.messageId,
      userId,
      MessageStatus.DELIVERED,
    );
    this.server.to(`chat:${message.chatId}`).emit('message.status', {
      messageId: message.id,
      status: message.status,
    });
  }

  @AsyncApiSend({
    channel: 'message.read',
    summary: 'Advance the read pointer in a conversation',
    description:
      'Forward-only and idempotent — passing an older messageId is a no-op.',
    message: {
      name: 'MessageReadInput',
      payload: class {
        conversationId: string;
        messageId: string;
      },
    },
  })
  @AsyncApiReceive({
    channel: 'message.read',
    summary: 'Broadcast: a participant advanced their read pointer',
    message: { name: 'MessageReadPayload', payload: MessageReadPayload },
  })
  @SubscribeMessage('message.read')
  async handleMessageRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; messageId: string },
  ) {
    const { userId } = client.data as SocketData;
    const result = await this.messageService.markChatAsRead(
      data.conversationId,
      userId,
      data.messageId,
    );
    this.server.to(`chat:${data.conversationId}`).emit('message.read', result);
  }

  @AsyncApiSend({
    channel: 'typing.start',
    summary: 'Notify others that the current user started typing',
    message: {
      name: 'TypingStartInput',
      payload: class {
        conversationId: string;
      },
    },
  })
  @AsyncApiReceive({
    channel: 'typing',
    summary: 'Broadcast: a participant started or stopped typing',
    description:
      'Received by all participants except the sender. `isTyping: true` for start, `false` for stop.',
    message: { name: 'TypingPayload', payload: TypingPayload },
  })
  @SubscribeMessage('typing.start')
  handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const room = `chat:${data.conversationId}`;
    if (!client.rooms.has(room)) return;

    const { userId } = client.data as SocketData;
    client.to(room).emit('typing', {
      conversationId: data.conversationId,
      userId,
      isTyping: true,
    });
  }

  @AsyncApiSend({
    channel: 'typing.stop',
    summary: 'Notify others that the current user stopped typing',
    message: {
      name: 'TypingStopInput',
      payload: class {
        conversationId: string;
      },
    },
  })
  @SubscribeMessage('typing.stop')
  handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const room = `chat:${data.conversationId}`;
    if (!client.rooms.has(room)) return;

    const { userId } = client.data as SocketData;
    client.to(room).emit('typing', {
      conversationId: data.conversationId,
      userId,
      isTyping: false,
    });
  }

  private broadcastPresence(
    chatIds: string[],
    userId: string,
    isOnline: boolean,
  ) {
    for (const chatId of chatIds) {
      this.server
        .to(`chat:${chatId}`)
        .emit('user.online', { userId, isOnline });
    }
  }
}
