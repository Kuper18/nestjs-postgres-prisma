import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AppConfigInterface } from 'src/interface/app.config.interface';
import { User } from 'generated/prisma/client';
import { UserService } from 'src/user/user.service';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService<AppConfigInterface>,
    private readonly userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request): string | null => {
          const token = req.cookies?.accessToken as unknown;

          return typeof token === 'string' ? token : null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow('JWT_SECRET'),
      algorithms: ['HS256'],
    });
  }

  async validate({ id }: { id: string }): Promise<User> {
    return await this.userService.findById(id);
  }
}
