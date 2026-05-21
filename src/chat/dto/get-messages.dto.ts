import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class GetMessagesDto {
  @ApiPropertyOptional({
    description:
      'Cursor for loading OLDER messages (scroll up). Pass `pagination.prevCursor` from a previous response.',
  })
  @IsOptional()
  @IsString()
  before?: string;

  @ApiPropertyOptional({
    description:
      'Cursor for loading NEWER messages (scroll down / catch up). Pass `pagination.nextCursor` from a previous response.',
  })
  @IsOptional()
  @IsString()
  after?: string;

  @ApiPropertyOptional({
    description:
      'Message UUID to anchor on. Returns a window of messages around it (~half before, half after). Use to jump to the first unread message.',
    example: 'm1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsOptional()
  @IsUUID()
  around?: string;

  @ApiPropertyOptional({
    description: 'Number of messages to return. Defaults to 20.',
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
