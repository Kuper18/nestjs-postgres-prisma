import { ApiProperty } from '@nestjs/swagger';
import { PickType } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { SignupDto } from './signup.dto';

export class ResetPasswordDto extends PickType(SignupDto, [
  'password',
] as const) {
  @ApiProperty({ description: 'Password reset token received via email' })
  @IsNotEmpty()
  @IsString()
  token: string;
}
