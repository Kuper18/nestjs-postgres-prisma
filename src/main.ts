import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { CorsIoAdapter } from './common/adapters/cors-io.adapter';
import { setupSwagger } from './config/swagger.config';
import { setupWsDocs } from './config/ws-docs.config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);
  const nodeEnv = configService.getOrThrow<string>('NODE_ENV');

  if (nodeEnv === 'production') {
    // Behind a reverse proxy: trust the first hop so the rate limiter keys
    // on the real client IP instead of the proxy's.
    app.set('trust proxy', 1);
  }

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useWebSocketAdapter(
    new CorsIoAdapter(app, configService.getOrThrow<string>('CLIENT_URL')),
  );
  app.use(cookieParser());

  if (nodeEnv === 'development') {
    setupSwagger(app);
    await setupWsDocs(app, process.env.PORT ?? 3000);
  }

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
