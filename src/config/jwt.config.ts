import { ConfigService } from '@nestjs/config';
import { JwtModuleOptions } from '@nestjs/jwt';
import { AppConfigInterface } from 'src/interface/app.config.interface';

export const getJwtConfig = (
  config: ConfigService<AppConfigInterface>,
): JwtModuleOptions => ({
  secret: config.getOrThrow('JWT_SECRET'),
  signOptions: { algorithm: 'HS256' },
  verifyOptions: { algorithms: ['HS256'], ignoreExpiration: false },
});
