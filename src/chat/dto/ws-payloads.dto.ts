import { ApiProperty } from '@nestjs/swagger';

export class MessageNewPayload {
  @ApiProperty({ example: 'm1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'c1b2a3d4-e5f6-7890-abcd-ef1234567890' })
  chatId: string;

  @ApiProperty({ example: 'u1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  senderId: string;

  @ApiProperty({ example: 'Hey, are you there?' })
  content: string;

  @ApiProperty({ enum: ['SENT', 'DELIVERED', 'READ'], example: 'SENT' })
  status: string;

  @ApiProperty({ example: null, nullable: true })
  readAt: string | null;

  @ApiProperty({ example: null, nullable: true })
  deletedAt: string | null;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  updatedAt: string;
}

export class MessageStatusPayload {
  @ApiProperty({ example: 'm1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  messageId: string;

  @ApiProperty({ enum: ['SENT', 'DELIVERED', 'READ'], example: 'DELIVERED' })
  status: string;
}

export class MessageReadPayload {
  @ApiProperty({ example: 'c1b2a3d4-e5f6-7890-abcd-ef1234567890' })
  chatId: string;

  @ApiProperty({ example: 'u1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  userId: string;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  lastReadAt: string;
}

export class TypingPayload {
  @ApiProperty({ example: 'c1b2a3d4-e5f6-7890-abcd-ef1234567890' })
  conversationId: string;

  @ApiProperty({ example: 'u1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  userId: string;

  @ApiProperty({ example: true })
  isTyping: boolean;
}

export class UserOnlinePayload {
  @ApiProperty({ example: 'u1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  userId: string;

  @ApiProperty({ example: true })
  isOnline: boolean;
}
