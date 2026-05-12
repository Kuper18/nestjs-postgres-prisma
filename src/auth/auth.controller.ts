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
import {
  ApiCookieAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
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

const COOKIES_SET_DESCRIPTION =
  'Sets `accessToken` and `refreshToken` as **httpOnly** cookies. These cookies are sent automatically by the browser on subsequent requests — do not store them manually.';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly registrationService: RegistrationService,
    private readonly passwordService: PasswordService,
    private readonly oauthService: OauthService,
  ) {}

  @ApiOperation({ summary: '🔓 Register a new user' })
  @ApiResponse({
    status: 201,
    description:
      'Registration successful. Verification email sent to the provided address.',
    schema: {
      example: {
        message:
          'Signup successful. Please check your email to verify your account.',
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'A user with this email already exists.',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error — check request body.',
  })
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @Post('signup')
  signup(@Body() dto: SignupDto) {
    return this.registrationService.signup(dto);
  }

  @ApiOperation({ summary: '🔓 Log in with email and password' })
  @ApiResponse({
    status: 200,
    description: `Login successful. ${COOKIES_SET_DESCRIPTION}`,
    schema: { example: { message: 'Login is successful' } },
  })
  @ApiResponse({ status: 400, description: 'Invalid email or password.' })
  @ApiResponse({ status: 401, description: 'Email is not verified.' })
  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Res({ passthrough: true }) res: Response, @Body() dto: LoginDto) {
    return this.authService.login(res, dto);
  }

  @ApiOperation({ summary: 'Refresh access and refresh tokens' })
  @ApiCookieAuth('accessToken')
  @ApiResponse({
    status: 200,
    description: `Tokens refreshed. ${COOKIES_SET_DESCRIPTION}`,
    schema: { example: { message: 'Login is successful' } },
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh token is missing, invalid, or does not match.',
  })
  @HttpCode(HttpStatus.OK)
  @Post('refresh-token')
  refreshTokens(
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    return this.authService.refreshTokens(res, req);
  }

  @ApiOperation({ summary: 'Log out the current user' })
  @ApiCookieAuth('accessToken')
  @ApiResponse({
    status: 204,
    description:
      'Logged out. The `accessToken` and `refreshToken` cookies are cleared.',
  })
  @ApiResponse({ status: 401, description: 'Not authenticated.' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('logout')
  logout(
    @Res({ passthrough: true }) res: Response,
    @Authorized('id') userId: string,
  ) {
    return this.authService.logout(res, userId);
  }

  @ApiOperation({
    summary: '🔓 Verify email address via token from email link',
  })
  @ApiQuery({
    name: 'token',
    description: 'Email verification token received in the verification email.',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Email verified successfully.',
    schema: { example: { message: 'Email verified successfully.' } },
  })
  @ApiResponse({ status: 400, description: 'Token is invalid or has expired.' })
  @HttpCode(HttpStatus.OK)
  @Public()
  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    return this.registrationService.verifyEmail(token);
  }

  @ApiOperation({ summary: '🔓 Resend email verification link' })
  @ApiResponse({
    status: 200,
    description: 'Verification email sent.',
    schema: { example: { message: 'Verification email sent.' } },
  })
  @ApiResponse({
    status: 400,
    description: 'Email not found or already verified.',
  })
  @HttpCode(HttpStatus.OK)
  @Public()
  @Post('resend-email-verification')
  resendVerification(@Body() dto: ResendVerificationDto) {
    return this.registrationService.resendVerificationEmail(dto.email);
  }

  @ApiOperation({ summary: '🔓 Request a password reset email' })
  @ApiResponse({
    status: 200,
    description: 'If the email exists, a password reset link has been sent.',
    schema: { example: { message: 'Password reset email sent.' } },
  })
  @HttpCode(HttpStatus.OK)
  @Public()
  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.passwordService.forgotPassword(dto.email);
  }

  @ApiOperation({ summary: '🔓 Reset password using token from email' })
  @ApiResponse({
    status: 200,
    description: 'Password updated successfully.',
    schema: { example: { message: 'Password has been reset successfully.' } },
  })
  @ApiResponse({ status: 400, description: 'Token is invalid or has expired.' })
  @HttpCode(HttpStatus.OK)
  @Public()
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.passwordService.resetPassword(dto);
  }

  @ApiOperation({
    summary:
      '🔓 Initiate Google OAuth login — redirects to Google consent screen',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirects to Google OAuth consent screen.',
  })
  @HttpCode(HttpStatus.OK)
  @Public()
  @UseGuards(GoogleOauthGuard)
  @Get('google')
  googleLogin() {}

  @ApiOperation({
    summary: '🔓 Google OAuth callback — handled automatically by Google',
  })
  @ApiResponse({
    status: 200,
    description: `OAuth login successful. ${COOKIES_SET_DESCRIPTION}`,
    schema: { example: { message: 'Login is successful' } },
  })
  @ApiResponse({ status: 401, description: 'Google authentication failed.' })
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
