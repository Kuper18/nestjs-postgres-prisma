import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IAuthModuleOptions } from '@nestjs/passport';

@Injectable()
export class GoogleOauthGuard extends AuthGuard('google') {
  override getAuthenticateOptions(): IAuthModuleOptions {
    return {
      prompt: 'select_account',
    };
  }
}
