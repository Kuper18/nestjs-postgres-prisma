import { UserService } from 'src/user/user.service';
import { SignupDto } from '../dto/signup.dto';
import { BcryptService } from './bcrypt.service';
import { VerificationTokenService } from './verification-token.service';
import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { TokenType } from 'generated/prisma/enums';

@Injectable()
export class RegistrationService {
  constructor(
    private readonly userService: UserService,
    private readonly bcryptService: BcryptService,
    private readonly verificationTokenService: VerificationTokenService,
  ) {}

  async signup(dto: SignupDto) {
    const existingUser = await this.userService.findByEmail(dto.email);

    if (existingUser) {
      throw new ConflictException('User with this email already exists.');
    }

    const hashedPassword = await this.bcryptService.hash(dto.password);
    const newUser = await this.userService.create({
      ...dto,
      password: hashedPassword,
    });

    await this.verificationTokenService.sendVerificationToken(
      newUser.id,
      newUser.email,
      TokenType.EMAIL_VERIFICATION,
    );

    return {
      message:
        'Signup successful. Please check your email to verify your account.',
    };
  }

  async verifyEmail(token: string) {
    const user = await this.verificationTokenService.consumeToken(
      token,
      TokenType.EMAIL_VERIFICATION,
    );

    if (!user) {
      throw new BadRequestException(
        'Verification link is invalid or has expired.',
      );
    }

    if (user.isVerified) {
      return { message: 'Email is already verified.' };
    }

    await this.userService.markAsVerified(user.id);

    return { message: 'Email verified successfully.' };
  }

  async resendVerificationEmail(email: string) {
    const user = await this.userService.findByEmail(email);

    if (!user) {
      throw new BadRequestException('Invalid email address.');
    }

    if (user.isVerified) {
      throw new BadRequestException('Your email is already verified.');
    }

    await this.verificationTokenService.guardResendToken(
      user.id,
      TokenType.EMAIL_VERIFICATION,
    );
    await this.verificationTokenService.sendVerificationToken(
      user.id,
      user.email,
      TokenType.EMAIL_VERIFICATION,
    );

    return { message: 'Verification email sent.' };
  }
}
