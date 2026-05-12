import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Chat App API')
    .setDescription(
      'REST API for the Chat App.\n\n' +
        '**Authentication**: All protected routes require a valid `accessToken` delivered as an `httpOnly` cookie. ' +
        'The server sets `accessToken` and `refreshToken` as `httpOnly` cookies on login, token refresh, and OAuth — ' +
        'they are never exposed in the response body.\n\n' +
        'Routes marked 🔓 are public. All others require the `accessToken` cookie.',
    )
    .setVersion('1.0')
    .addCookieAuth('accessToken', {
      type: 'apiKey',
      in: 'cookie',
      name: 'accessToken',
      description: 'JWT access token stored as an httpOnly cookie.',
    })
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
}
