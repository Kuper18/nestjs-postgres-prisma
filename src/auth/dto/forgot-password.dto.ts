import { PickType } from '@nestjs/mapped-types';
import { SignupDto } from './signup.dto';

export class ForgotPasswordDto extends PickType(SignupDto, [
  'email',
] as const) {}
