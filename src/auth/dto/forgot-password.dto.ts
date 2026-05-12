import { PickType } from '@nestjs/swagger';
import { SignupDto } from './signup.dto';

export class ForgotPasswordDto extends PickType(SignupDto, [
  'email',
] as const) {}
