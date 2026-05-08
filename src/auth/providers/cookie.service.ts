import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config/dist/config.service';
import { Response } from 'express';
import { parseTtlToDate } from 'src/common/utils/parse-ttl-to-date';
import { AppConfigInterface } from 'src/interface/app.config.interface';
import { TokenResponseType } from '../types/token-response.type';
import type { CookieOptions } from 'express';

@Injectable()
export class CookieService {
  constructor(
    private readonly configService: ConfigService<AppConfigInterface>,
  ) {}

  private getCookieOptions(expires: Date): CookieOptions {
    const isDev = this.configService.getOrThrow('NODE_ENV') === 'development';

    return {
      httpOnly: true,
      domain: this.configService.getOrThrow<string>('COOKIE_DOMAIN'),
      expires,
      secure: !isDev,
      sameSite: 'lax',
    };
  }

  setCookie(res: Response, tokens: TokenResponseType) {
    res.cookie(
      'refreshToken',
      tokens.refreshToken,
      this.getCookieOptions(
        parseTtlToDate(this.configService.getOrThrow('JWT_REFRESH_TOKEN_TTL')),
      ),
    );
    res.cookie(
      'accessToken',
      tokens.accessToken,
      this.getCookieOptions(
        parseTtlToDate(this.configService.getOrThrow('JWT_ACCESS_TOKEN_TTL')),
      ),
    );
  }

  deleteCookie(res: Response) {
    res.cookie('refreshToken', '', this.getCookieOptions(new Date(0)));
    res.cookie('accessToken', '', this.getCookieOptions(new Date(0)));
  }
}
