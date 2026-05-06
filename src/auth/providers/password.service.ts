import { UserService } from 'src/user/user.service';
import { BcryptService } from './bcrypt.service';
import { VerificationTokenService } from './verification-token.service';
import { TokenType } from 'generated/prisma/enums';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ResetPasswordDto } from '../dto/reset-password.dto';

@Injectable()
export class PasswordService {
  constructor(
    private readonly userService: UserService,
    private readonly bcryptService: BcryptService,
    private readonly verificationTokenService: VerificationTokenService,
  ) {}

  async forgotPassword(email: string) {
    const user = await this.userService.findByEmail(email);

    if (user && user.isVerified) {
      await this.verificationTokenService.guardResendToken(
        user.id,
        TokenType.PASSWORD_RESET,
      );
      await this.verificationTokenService.sendVerificationToken(
        user.id,
        user.email,
        TokenType.PASSWORD_RESET,
      );
    }

    return { message: 'If the email exists, you will receive a reset link.' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.verificationTokenService.consumeToken(
      dto.token,
      TokenType.PASSWORD_RESET,
    );

    if (!user) {
      throw new BadRequestException('Reset link is invalid or has expired.');
    }

    const hashedPassword = await this.bcryptService.hash(dto.password);
    await this.userService.updatePassword({
      id: user.id,
      password: hashedPassword,
    });

    return { message: 'Password reset successfully.' };
  }
}
