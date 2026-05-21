import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class MarkAsReadDto {
  @ApiProperty({
    description:
      'UUID of the last message the user has read. Your read position (`lastReadAt`) advances to this message; all messages up to and including it count as read.',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsUUID()
  messageId: string;
}
