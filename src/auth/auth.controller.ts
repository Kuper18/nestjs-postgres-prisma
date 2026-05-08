import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Authorized } from 'src/common/decorators/authorized.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { GoogleOauthGuard } from 'src/common/guards/google-oauth.guard';
import type { RequestWithUser } from 'src/interface/request-with-user.interface';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SignupDto } from './dto/signup.dto';
import { AuthService } from './providers/auth.service';
import { OauthService } from './providers/oauth.service';
import { PasswordService } from './providers/password.service';
import { RegistrationService } from './providers/registration.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly registrationService: RegistrationService,
    private readonly passwordService: PasswordService,
    private readonly oauthService: OauthService,
  ) {}

  @Public()
  @HttpCode(HttpStatus.CREATED)
  @Post('signup')
  signup(@Body() dto: SignupDto) {
    return this.registrationService.signup(dto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Res({ passthrough: true }) res: Response, @Body() dto: LoginDto) {
    return this.authService.login(res, dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('refresh-token')
  refreshTokens(
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    return this.authService.refreshTokens(res, req);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('logout')
  logout(
    @Res({ passthrough: true }) res: Response,
    @Authorized('id') userId: string,
  ) {
    return this.authService.logout(res, userId);
  }

  @HttpCode(HttpStatus.OK)
  @Public()
  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    return this.registrationService.verifyEmail(token);
  }

  @HttpCode(HttpStatus.OK)
  @Public()
  @Post('resend-email-verification')
  resendVerification(@Body() dto: ResendVerificationDto) {
    return this.registrationService.resendVerificationEmail(dto.email);
  }

  @HttpCode(HttpStatus.OK)
  @Public()
  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.passwordService.forgotPassword(dto.email);
  }

  @HttpCode(HttpStatus.OK)
  @Public()
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.passwordService.resetPassword(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Public()
  @UseGuards(GoogleOauthGuard)
  @Get('google')
  googleLogin() {}

  @HttpCode(HttpStatus.OK)
  @Public()
  @UseGuards(GoogleOauthGuard)
  @Get('google/callback')
  googleCallback(
    @Req() req: RequestWithUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.oauthService.googleCallback(res, req.user);
  }
}
