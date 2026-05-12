import { PickType } from '@nestjs/swagger';
import { SignupDto } from './signup.dto';

export class ResendVerificationDto extends PickType(SignupDto, [
  'email',
] as const) {}
