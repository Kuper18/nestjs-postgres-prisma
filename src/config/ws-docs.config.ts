import { INestApplication } from '@nestjs/common';
import { AsyncApiDocumentBuilder, AsyncApiModule } from 'nestjs-asyncapi';

export async function setupWsDocs(
  app: INestApplication,
  port: number | string,
): Promise<void> {
  const config = new AsyncApiDocumentBuilder()
    .setTitle('Chat WebSocket API')
    .setDescription(
      'Real-time WebSocket events for the Chat module.\n\n' +
        '**Namespace**: `/chat`\n\n' +
        '**Authentication**: connect with `withCredentials: true` — the browser sends ' +
        'the `accessToken` httpOnly cookie automatically. The connection is rejected if the ' +
        'token is missing, invalid, or the user is not verified.\n\n' +
        '**Protocol**: Socket.IO over WebSocket.',
    )
    .setVersion('1.0')
    .setDefaultContentType('application/json')
    .addServer('local', {
      host: `localhost:${port}`,
      pathname: '/chat',
      protocol: 'socket.io',
      description: 'Local development server',
    })
    .build();

  const document = AsyncApiModule.createDocument(app, config);
  await AsyncApiModule.setup('/ws-docs', app, document);
}
