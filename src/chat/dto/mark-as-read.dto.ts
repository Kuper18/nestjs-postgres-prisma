import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class MarkAsReadDto {
  @ApiProperty({
    description:
      'UUID of the last message the user has read. All messages in this chat up to and including this message will be marked as READ.',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsUUID()
  messageId: string;
}
