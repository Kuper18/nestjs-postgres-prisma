import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SignupDto } from '../dto/signup.dto';
import { UserService } from 'src/user/user.service';
import { BcryptService } from './bcrypt.service';
import { TokenService } from './token.service';
import { CookieService } from './cookie.service';
import { Request, Response } from 'express';
import { LoginDto } from '../dto/login.dto';
import { VerificationTokenService } from './verification-token.service';
import { TokenType } from 'generated/prisma/enums';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly bcryptService: BcryptService,
    private readonly tokenService: TokenService,
    private readonly cookieService: CookieService,
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

  async login(res: Response, dto: LoginDto) {
    const user = await this.userService.findByEmail(dto.email);

    if (!user) {
      throw new BadRequestException('Invalid email or password.');
    }

    const isMatch = await this.bcryptService.compare(
      dto.password,
      user.password,
    );

    if (!isMatch) {
      throw new BadRequestException('Invalid email or password.');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException(
        'Email is not verified. Please check your inbox.',
      );
    }

    return this.auth(res, user.id);
  }

  async logout(res: Response, id: string) {
    const user = await this.userService.findById(id);
    await this.userService.updateRefreshToken({
      id: user.id,
      refreshToken: null,
    });

    return this.cookieService.deleteCookie(res);
  }

  async refreshTokens(res: Response, req: Request) {
    const refreshToken = req.cookies.refreshToken as string;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is not valid.');
    }

    const payload = await this.tokenService.verifyToken(refreshToken);
    const user = await this.userService.findById(payload.id);

    if (!user || !payload) {
      throw new UnauthorizedException('Access denied.');
    }

    const isMatch = await this.bcryptService.compare(
      refreshToken,
      user.refreshToken,
    );

    if (!isMatch) {
      throw new UnauthorizedException('Access denied.');
    }

    return this.auth(res, user.id);
  }

  async getMe(id: string) {
    return await this.userService.findById(id);
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

    await this.guardResendEmailVerification(user.id);
    await this.verificationTokenService.sendVerificationToken(
      user.id,
      user.email,
      TokenType.EMAIL_VERIFICATION,
    );

    return { message: 'Verification email sent.' };
  }

  private async auth(res: Response, userId: string) {
    const { accessToken, refreshToken } =
      this.tokenService.generateTokens(userId);
    const hashedToken = await this.bcryptService.hash(refreshToken);

    await this.userService.updateRefreshToken({
      id: userId,
      refreshToken: hashedToken,
    });
    this.cookieService.setCookie(res, refreshToken);

    return { accessToken };
  }

  private async guardResendEmailVerification(userId: string): Promise<void> {
    const canResend = await this.verificationTokenService.canResendToken(
      userId,
      TokenType.EMAIL_VERIFICATION,
    );

    if (!canResend) {
      throw new BadRequestException(
        'Please wait 1 minute before requesting another email.',
      );
    }
  }
}
