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
import { Authorized } from 'src/common/decorators/authorized.decorator';
import { CreateChatDto } from './dto/create-chat.dto';
import { GetMessagesDto } from './dto/get-messages.dto';
import { MarkAsReadDto } from './dto/mark-as-read.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ChatService } from './services/chat.service';
import { MessageService } from './services/message.service';

@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly messageService: MessageService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createChat(@Authorized('id') userId: string, @Body() dto: CreateChatDto) {
    return this.chatService.createDirect(userId, dto.recipientId);
  }

  @Get()
  findAllChats(@Authorized('id') userId: string) {
    return this.chatService.findAllForUser(userId);
  }

  @Get(':id')
  findChat(@Authorized('id') userId: string, @Param('id') chatId: string) {
    return this.chatService.findById(chatId, userId);
  }

  @Get(':id/message')
  getMessages(
    @Authorized('id') userId: string,
    @Param('id') chatId: string,
    @Query() query: GetMessagesDto,
  ) {
    return this.messageService.findMany(
      chatId,
      userId,
      query.cursor,
      query.limit,
    );
  }

  @Post(':id/message')
  @HttpCode(HttpStatus.CREATED)
  sendMessage(
    @Authorized('id') userId: string,
    @Param('id') chatId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.messageService.create(chatId, userId, dto.content);
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  markAsRead(
    @Authorized('id') userId: string,
    @Param('id') chatId: string,
    @Body() dto: MarkAsReadDto,
  ) {
    return this.messageService.markChatAsRead(chatId, userId, dto.messageId);
  }

  @Delete('message/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteMessage(
    @Authorized('id') userId: string,
    @Param('id') messageId: string,
  ) {
    return this.messageService.softDelete(messageId, userId);
  }
}
