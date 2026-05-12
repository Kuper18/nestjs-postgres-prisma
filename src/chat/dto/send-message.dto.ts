import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({
    description: 'Text content of the message. Must not be empty.',
    example: 'Hey, are you there?',
    minLength: 1,
  })
  @IsString()
  @MinLength(1)
  content: string;
}
