import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class GetMessagesDto {
  @ApiPropertyOptional({
    description:
      'Pagination cursor returned from the previous response (`pagination.cursor`). Pass it to fetch the next page. Omit to get the latest messages.',
    example: 'eyJjcmVhdGVkQXQiOiIyMDI0LTAxLTE1VDEwOjMwOjAwLjAwMFoiLCJpZCI6InV1aWQifQ==',
  })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({
    description: 'Number of messages to return per page. Defaults to 20.',
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;
}
