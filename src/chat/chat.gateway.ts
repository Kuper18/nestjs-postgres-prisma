import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtTokenService } from 'src/auth/providers/jwt-token.service';
import { MessageStatus } from 'src/generated/prisma/client';
import { ChatService } from './services/chat.service';
import { MessageService } from './services/message.service';

@WebSocketGateway({
  cors: { origin: process.env.CLIENT_URL, credentials: true },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtTokenService: JwtTokenService,
    private readonly chatService: ChatService,
    private readonly messageService: MessageService,
  ) {}

  async handleConnection(client: Socket) {
    const cookieHeader = client.handshake.headers.cookie ?? '';
    const token = /(?:^|;\s*)accessToken=([^;]*)/.exec(cookieHeader)?.[1];

    if (!token) {
      client.disconnect(true);
      return;
    }

    try {
      const payload = await this.jwtTokenService.verifyToken(token);
      (client.data as { userId: string }).userId = payload.id;

      const chats = await this.chatService.findAllForUser(payload.id);
      for (const chat of chats) {
        void client.join(`chat:${chat.id}`);
      }
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    const { userId } = client.data as { userId?: string };
    if (userId) {
      this.server.emit('user.online', { userId, isOnline: false });
    }
  }

  @SubscribeMessage('message.send')
  async handleMessageSend(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; content: string },
  ) {
    const { userId } = client.data as { userId: string };
    await this.chatService.findById(data.conversationId, userId);

    const message = await this.messageService.create(
      data.conversationId,
      userId,
      data.content,
    );
    this.server.to(`chat:${data.conversationId}`).emit('message.new', message);
  }

  @SubscribeMessage('message.delivered')
  async handleMessageDelivered(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string },
  ) {
    const message = await this.messageService.updateStatus(
      data.messageId,
      MessageStatus.DELIVERED,
    );
    this.server.to(`chat:${message.chatId}`).emit('message.status', {
      messageId: message.id,
      status: message.status,
    });
  }

  @SubscribeMessage('message.read')
  async handleMessageRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; messageId: string },
  ) {
    const { userId } = client.data as { userId: string };
    await this.messageService.markChatAsRead(
      data.conversationId,
      userId,
      data.messageId,
    );
    this.server.to(`chat:${data.conversationId}`).emit('message.status', {
      messageId: data.messageId,
      status: MessageStatus.READ,
    });
  }

  @SubscribeMessage('typing.start')
  handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const { userId } = client.data as { userId: string };
    client.to(`chat:${data.conversationId}`).emit('typing', {
      conversationId: data.conversationId,
      userId,
      isTyping: true,
    });
  }

  @SubscribeMessage('typing.stop')
  handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const { userId } = client.data as { userId: string };
    client.to(`chat:${data.conversationId}`).emit('typing', {
      conversationId: data.conversationId,
      userId,
      isTyping: false,
    });
  }
}
