import { PickType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsString } from 'class-validator';
import { SignupDto } from './signup.dto';

export class ResetPasswordDto extends PickType(SignupDto, [
  'password',
] as const) {
  @IsNotEmpty()
  @IsString()
  token: string;
}
