import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

const CHAT_EXAMPLE = {
  id: 'c1b2a3d4-e5f6-7890-abcd-ef1234567890',
  type: 'DIRECT',
  createdAt: '2024-01-15T10:00:00.000Z',
  updatedAt: '2024-01-15T10:30:00.000Z',
  participants: [
    {
      id: 'p1b2c3d4-e5f6-7890-abcd-ef1234567890',
      chatId: 'c1b2a3d4-e5f6-7890-abcd-ef1234567890',
      userId: 'u1b2c3d4-e5f6-7890-abcd-ef1234567890',
      user: {
        id: 'u1b2c3d4-e5f6-7890-abcd-ef1234567890',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      },
    },
    {
      id: 'p2b2c3d4-e5f6-7890-abcd-ef1234567890',
      chatId: 'c1b2a3d4-e5f6-7890-abcd-ef1234567890',
      userId: 'u2b2c3d4-e5f6-7890-abcd-ef1234567890',
      user: {
        id: 'u2b2c3d4-e5f6-7890-abcd-ef1234567890',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
      },
    },
  ],
};

const MESSAGE_EXAMPLE = {
  id: 'm1b2c3d4-e5f6-7890-abcd-ef1234567890',
  chatId: 'c1b2a3d4-e5f6-7890-abcd-ef1234567890',
  senderId: 'u1b2c3d4-e5f6-7890-abcd-ef1234567890',
  content: 'Hey, are you there?',
  status: 'SENT',
  readAt: null,
  deletedAt: null,
  createdAt: '2024-01-15T10:30:00.000Z',
  updatedAt: '2024-01-15T10:30:00.000Z',
};

function chatIdParam() {
  return ApiParam({
    name: 'id',
    description: 'Chat UUID',
    example: 'c1b2a3d4-e5f6-7890-abcd-ef1234567890',
  });
}

export const CreateChatDocs = () =>
  applyDecorators(
    ApiOperation({ summary: 'Create a direct chat with another user' }),
    ApiResponse({
      status: 201,
      description:
        'Chat created (or returned if it already exists between the two users).',
      schema: { example: CHAT_EXAMPLE },
    }),
    ApiResponse({
      status: 400,
      description: 'Cannot create a chat with yourself.',
    }),
    ApiResponse({ status: 401, description: 'Not authenticated.' }),
  );

export const FindAllChatsDocs = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get all chats for the current user' }),
    ApiResponse({
      status: 200,
      description:
        "List of chats ordered by most recently updated. Each chat includes participants, the last non-deleted message, the current user's unread count, and the id of their first unread message (for jump-to-unread).",
      schema: {
        example: [
          {
            ...CHAT_EXAMPLE,
            messages: [MESSAGE_EXAMPLE],
            unreadCount: 3,
            firstUnreadMessageId: 'm1b2c3d4-e5f6-7890-abcd-ef1234567890',
          },
        ],
      },
    }),
    ApiResponse({ status: 401, description: 'Not authenticated.' }),
  );

export const FindChatDocs = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get a single chat by ID' }),
    chatIdParam(),
    ApiResponse({
      status: 200,
      description:
        "Chat with all participants, plus the current user's unread count and first unread message id.",
      schema: {
        example: {
          ...CHAT_EXAMPLE,
          unreadCount: 3,
          firstUnreadMessageId: 'm1b2c3d4-e5f6-7890-abcd-ef1234567890',
        },
      },
    }),
    ApiResponse({ status: 401, description: 'Not authenticated.' }),
    ApiResponse({
      status: 403,
      description: 'You are not a participant of this chat.',
    }),
    ApiResponse({ status: 404, description: 'Chat not found.' }),
  );

export const GetMessagesDocs = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get messages for a chat (bidirectional cursor pagination)',
      description:
        'Returns messages ordered oldest-first. Modes (mutually exclusive): omit all params for the latest page; `before` to load older (scroll up); `after` to load newer (scroll down); `around` to fetch a window centered on a message (jump to first unread). Use `pagination.prevCursor`/`nextCursor` to page in each direction.',
    }),
    chatIdParam(),
    ApiResponse({
      status: 200,
      description: 'Paginated list of messages (oldest-first).',
      schema: {
        example: {
          data: [MESSAGE_EXAMPLE],
          pagination: {
            prevCursor:
              'eyJjcmVhdGVkQXQiOiIyMDI0LTAxLTE1VDEwOjMwOjAwLjAwMFoiLCJpZCI6InV1aWQifQ==',
            nextCursor: null,
            hasPrev: true,
            hasNext: false,
          },
        },
      },
    }),
    ApiResponse({ status: 401, description: 'Not authenticated.' }),
    ApiResponse({
      status: 403,
      description: 'You are not a participant of this chat.',
    }),
    ApiResponse({ status: 404, description: 'Chat not found.' }),
  );

export const SendMessageDocs = () =>
  applyDecorators(
    ApiOperation({ summary: 'Send a message to a chat' }),
    chatIdParam(),
    ApiResponse({
      status: 201,
      description: 'Message sent.',
      schema: { example: MESSAGE_EXAMPLE },
    }),
    ApiResponse({
      status: 400,
      description: 'Validation error — content must not be empty.',
    }),
    ApiResponse({ status: 401, description: 'Not authenticated.' }),
    ApiResponse({
      status: 403,
      description: 'You are not a participant of this chat.',
    }),
    ApiResponse({ status: 404, description: 'Chat not found.' }),
    ApiResponse({
      status: 429,
      description: 'Rate limit exceeded (max 30 messages per 10 seconds).',
    }),
  );

export const MarkAsReadDocs = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Advance your read position in a chat',
      description:
        'Sets your read pointer (`lastReadAt`) to the given message. Idempotent and forward-only — passing an older message never moves the pointer back. Emits a `message.read` event to other participants over WebSocket.',
    }),
    chatIdParam(),
    ApiResponse({ status: 204, description: 'Read position updated.' }),
    ApiResponse({ status: 401, description: 'Not authenticated.' }),
    ApiResponse({ status: 404, description: 'Message not found in this chat.' }),
  );

export const DeleteMessageDocs = () =>
  applyDecorators(
    ApiOperation({ summary: 'Soft-delete a message' }),
    ApiParam({
      name: 'id',
      description: 'Message UUID',
      example: 'm1b2c3d4-e5f6-7890-abcd-ef1234567890',
    }),
    ApiResponse({ status: 204, description: 'Message deleted.' }),
    ApiResponse({ status: 401, description: 'Not authenticated.' }),
    ApiResponse({
      status: 403,
      description: 'You can only delete your own messages.',
    }),
    ApiResponse({ status: 404, description: 'Message not found.' }),
  );
