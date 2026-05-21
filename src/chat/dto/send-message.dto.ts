import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export const MAX_MESSAGE_LENGTH = 4000;

export class SendMessageDto {
  @ApiProperty({
    description: 'Text content of the message. Must not be empty.',
    example: 'Hey, are you there?',
    minLength: 1,
    maxLength: MAX_MESSAGE_LENGTH,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_MESSAGE_LENGTH)
  content: string;
}
