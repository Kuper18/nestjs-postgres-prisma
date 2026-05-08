import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AppConfigInterface } from 'src/interface/app.config.interface';
import { TokenResponseType } from '../types/token-response.type';

@Injectable()
export class JwtTokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService<AppConfigInterface>,
  ) {}

  generateTokens(id: string): TokenResponseType {
    const payload = { id };
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.config.getOrThrow('JWT_ACCESS_TOKEN_TTL'),
    });
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.config.getOrThrow('JWT_REFRESH_TOKEN_TTL'),
    });

    return { accessToken, refreshToken };
  }

  async verifyToken(token: string): Promise<{ id: string }> {
    try {
      return await this.jwtService.verifyAsync(token);
    } catch {
      throw new UnauthorizedException('Refresh token is not valid.');
    }
  }
}
