import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateChatDto {
  @ApiProperty({
    description: 'UUID of the user to start a direct chat with.',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsUUID()
  recipientId: string;
}
