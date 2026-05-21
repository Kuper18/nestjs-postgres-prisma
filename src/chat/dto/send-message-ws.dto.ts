import { IsUUID } from 'class-validator';
import { SendMessageDto } from './send-message.dto';

export class SendMessageWsDto extends SendMessageDto {
  @IsUUID()
  conversationId: string;
}
