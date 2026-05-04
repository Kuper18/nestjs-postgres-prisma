import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { SignupDto } from './dto/signup.dto';
import { AuthService } from './providers/auth.service';
import type { Request, Response } from 'express';
import { LoginDto } from './dto/login.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { Authorized } from 'src/common/decorators/authorized.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @HttpCode(HttpStatus.CREATED)
  @Post('signup')
  signup(@Res({ passthrough: true }) res: Response, @Body() dto: SignupDto) {
    return this.authService.signup(res, dto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  logion(@Res({ passthrough: true }) res: Response, @Body() dto: LoginDto) {
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
  @Get('me')
  getMe(@Authorized('id') userId: string) {
    this.getMe(userId);
  }
}
