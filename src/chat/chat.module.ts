import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { UserModule } from 'src/user/user.module';
import { WsThrottlerGuard } from 'src/common/guards/ws-throttler.guard';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './services/chat.service';
import { MessageService } from './services/message.service';

@Module({
  imports: [AuthModule, UserModule],
  controllers: [ChatController],
  providers: [ChatService, MessageService, ChatGateway, WsThrottlerGuard],
})
export class ChatModule {}
