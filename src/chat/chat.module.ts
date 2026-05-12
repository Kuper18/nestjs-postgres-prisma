import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './services/chat.service';
import { MessageService } from './services/message.service';

@Module({
  imports: [AuthModule],
  controllers: [ChatController],
  providers: [ChatService, MessageService, ChatGateway],
})
export class ChatModule {}
