import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config/dist/config.service';
import { Response } from 'express';
import { parseTtlToDate } from 'src/common/utils/parse-ttl-to-date';
import { AppConfigInterface } from 'src/interface/app.config.interface';

@Injectable()
export class CookieService {
  constructor(
    private readonly configService: ConfigService<AppConfigInterface>,
  ) {}

  private readonly isDev = () =>
    this.configService.getOrThrow('NODE_ENV') === 'development';

  setCookie(res: Response, value: string) {
    res.cookie('refreshToken', value, {
      httpOnly: true,
      domain: this.configService.getOrThrow('COOKIE_DOMAIN'),
      expires: parseTtlToDate(
        this.configService.getOrThrow('JWT_REFRESH_TOKEN_TTL'),
      ),
      maxAge: 7 * 24 * 60 * 60 * 1000,
      secure: !this.isDev(),
      sameSite: 'lax',
    });
  }

  deleteCookie(res: Response) {
    res.cookie('refreshToken', '', {
      httpOnly: true,
      domain: this.configService.getOrThrow('COOKIE_DOMAIN'),
      expires: new Date(0),
      secure: !this.isDev(),
      sameSite: 'lax',
    });
  }
}
