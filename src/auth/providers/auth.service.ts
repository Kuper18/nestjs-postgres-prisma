import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { UserService } from 'src/user/user.service';
import { LoginDto } from '../dto/login.dto';
import { BcryptService } from './bcrypt.service';
import { CookieService } from './cookie.service';
import { JwtTokenService } from './jwt-token.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly bcryptService: BcryptService,
    private readonly jwtTokenService: JwtTokenService,
    private readonly cookieService: CookieService,
  ) {}

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

    const payload = await this.jwtTokenService.verifyToken(refreshToken);
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

  async auth(res: Response, userId: string) {
    const { accessToken, refreshToken } =
      this.jwtTokenService.generateTokens(userId);
    const hashedToken = await this.bcryptService.hash(refreshToken);

    await this.userService.updateRefreshToken({
      id: userId,
      refreshToken: hashedToken,
    });
    this.cookieService.setCookie(res, refreshToken);

    return { accessToken };
  }
}
