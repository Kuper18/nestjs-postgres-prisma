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

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly bcryptService: BcryptService,
    private readonly tokenService: TokenService,
    private readonly cookieService: CookieService,
  ) {}
  async signup(res: Response, dto: SignupDto) {
    const existingUser = await this.userService.findByEmail(dto.email);

    if (existingUser) {
      throw new ConflictException('User with this email already exists.');
    }

    const hashedPassword = await this.bcryptService.hash(dto.password);
    const newUser = await this.userService.create({
      ...dto,
      password: hashedPassword,
    });

    return this.auth(res, newUser.id);
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
}
