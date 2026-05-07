import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Profile } from 'passport-google-oauth20';
import { UserService } from 'src/user/user.service';
import { AuthService } from './auth.service';
import { Response } from 'express';
import { User } from 'generated/prisma/client';
import { ConfigService } from '@nestjs/config';
import { AppConfigInterface } from 'src/interface/app.config.interface';

@Injectable()
export class OauthService {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly configService: ConfigService<AppConfigInterface>,
  ) {}

  async validate(profile: Profile) {
    const email = profile.emails?.[0].value;
    const firstName = profile.name?.givenName;
    const lastName = profile.name?.familyName;

    if (!email || !firstName || !lastName) {
      throw new UnauthorizedException(
        'No email or name found in Google profile',
      );
    }

    const user = await this.userService.findByEmail(email);

    if (user) {
      if (!user.isVerified) {
        await this.userService.markAsVerified(user.id);
      }

      return user;
    }

    return await this.userService.create({
      email,
      firstName,
      lastName,
      isVerified: true,
    });
  }

  async googleCallback(res: Response, user: User) {
    const { accessToken } = await this.authService.auth(res, user.id);

    return res.redirect(
      `${this.configService.getOrThrow('CLIENT_URL')}?token=${accessToken}`,
    );
  }
}
