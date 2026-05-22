import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { Throttle, seconds } from '@nestjs/throttler';
import { Authorized } from 'src/common/decorators/authorized.decorator';
import { ChatGateway } from './chat.gateway';
import {
  CreateChatDocs,
  DeleteMessageDocs,
  FindAllChatsDocs,
  FindChatDocs,
  GetMessagesDocs,
  MarkAsReadDocs,
  SendMessageDocs,
} from './chat.swagger';
import { CreateChatDto } from './dto/create-chat.dto';
import { GetMessagesDto } from './dto/get-messages.dto';
import { MarkAsReadDto } from './dto/mark-as-read.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ChatService } from './services/chat.service';
import { MessageService } from './services/message.service';

@ApiTags('Chat')
@ApiCookieAuth('accessToken')
@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly messageService: MessageService,
    private readonly chatGateway: ChatGateway,
  ) {}

  @CreateChatDocs()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createChat(
    @Authorized('id') userId: string,
    @Body() dto: CreateChatDto,
  ) {
    const chat = await this.chatService.createDirect(userId, dto.recipientId);
    await this.chatGateway.addParticipantsToChatRoom(chat.id, [
      userId,
      dto.recipientId,
    ]);
    return chat;
  }

  @FindAllChatsDocs()
  @Get()
  findAllChats(@Authorized('id') userId: string) {
    return this.chatService.findAllForUser(userId);
  }

  @FindChatDocs()
  @Get(':id')
  findChat(@Authorized('id') userId: string, @Param('id') chatId: string) {
    return this.chatService.getChatDetail(chatId, userId);
  }

  @GetMessagesDocs()
  @Get(':id/message')
  getMessages(
    @Authorized('id') userId: string,
    @Param('id') chatId: string,
    @Query() query: GetMessagesDto,
  ) {
    return this.messageService.findMany(chatId, userId, query);
  }

  @SendMessageDocs()
  @Throttle({ default: { limit: 30, ttl: seconds(10) } })
  @Post(':id/message')
  @HttpCode(HttpStatus.CREATED)
  sendMessage(
    @Authorized('id') userId: string,
    @Param('id') chatId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.messageService.create(chatId, userId, dto.content);
  }

  @MarkAsReadDocs()
  @Patch(':id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  markAsRead(
    @Authorized('id') userId: string,
    @Param('id') chatId: string,
    @Body() dto: MarkAsReadDto,
  ) {
    return this.messageService.markChatAsRead(chatId, userId, dto.messageId);
  }

  @DeleteMessageDocs()
  @Delete('message/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteMessage(
    @Authorized('id') userId: string,
    @Param('id') messageId: string,
  ) {
    return this.messageService.softDelete(messageId, userId);
  }
}
