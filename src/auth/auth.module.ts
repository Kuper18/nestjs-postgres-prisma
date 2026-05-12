import { Module } from '@nestjs/common';
import { AuthService } from './providers/auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getJwtConfig } from 'src/config/jwt.config';
import { UserModule } from 'src/user/user.module';
import { BcryptService } from './providers/bcrypt.service';
import { JwtTokenService } from './providers/jwt-token.service';
import { CookieService } from './providers/cookie.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { MailModule } from 'src/mail/mail.module';
import { VerificationTokenService } from './providers/verification-token.service';
import { RegistrationService } from './providers/registration.service';
import { PasswordService } from './providers/password.service';
import { GoogleStrategy } from './strategies/google.strategy';
import { OauthService } from './providers/oauth.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getJwtConfig,
    }),
    PassportModule,
    UserModule,
    MailModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    BcryptService,
    JwtTokenService,
    CookieService,
    OauthService,
    RegistrationService,
    PasswordService,
    VerificationTokenService,
    JwtStrategy,
    GoogleStrategy,
  ],
  exports: [JwtTokenService],
})
export class AuthModule {}
