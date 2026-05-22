import { applyDecorators } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';

const COOKIES_SET_DESCRIPTION =
  'Sets `accessToken` and `refreshToken` as **httpOnly** cookies. These cookies are sent automatically by the browser on subsequent requests — do not store them manually.';

export const SignupDocs = () =>
  applyDecorators(
    ApiOperation({ summary: '🔓 Register a new user' }),
    ApiResponse({
      status: 201,
      description:
        'Registration successful. Verification email sent to the provided address.',
      schema: {
        example: {
          message:
            'Signup successful. Please check your email to verify your account.',
        },
      },
    }),
    ApiResponse({
      status: 409,
      description: 'A user with this email already exists.',
    }),
    ApiResponse({
      status: 400,
      description: 'Validation error — check request body.',
    }),
    ApiResponse({
      status: 429,
      description: 'Rate limit exceeded (max 5 requests per minute).',
    }),
  );

export const LoginDocs = () =>
  applyDecorators(
    ApiOperation({ summary: '🔓 Log in with email and password' }),
    ApiResponse({
      status: 200,
      description: `Login successful. ${COOKIES_SET_DESCRIPTION}`,
      schema: { example: { message: 'Login is successful' } },
    }),
    ApiResponse({ status: 400, description: 'Invalid email or password.' }),
    ApiResponse({ status: 401, description: 'Email is not verified.' }),
    ApiResponse({
      status: 429,
      description: 'Rate limit exceeded (max 10 requests per minute).',
    }),
  );

export const RefreshTokenDocs = () =>
  applyDecorators(
    ApiOperation({ summary: 'Refresh access and refresh tokens' }),
    ApiCookieAuth('accessToken'),
    ApiResponse({
      status: 200,
      description: `Tokens refreshed. ${COOKIES_SET_DESCRIPTION}`,
      schema: { example: { message: 'Login is successful' } },
    }),
    ApiResponse({
      status: 401,
      description: 'Refresh token is missing, invalid, or does not match.',
    }),
  );

export const LogoutDocs = () =>
  applyDecorators(
    ApiOperation({ summary: 'Log out the current user' }),
    ApiCookieAuth('accessToken'),
    ApiResponse({
      status: 204,
      description:
        'Logged out. The `accessToken` and `refreshToken` cookies are cleared.',
    }),
    ApiResponse({ status: 401, description: 'Not authenticated.' }),
  );

export const VerifyEmailDocs = () =>
  applyDecorators(
    ApiOperation({
      summary: '🔓 Verify email address via token from email link',
    }),
    ApiQuery({
      name: 'token',
      description:
        'Email verification token received in the verification email.',
      example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    }),
    ApiResponse({
      status: 200,
      description: 'Email verified successfully.',
      schema: { example: { message: 'Email verified successfully.' } },
    }),
    ApiResponse({
      status: 400,
      description: 'Token is invalid or has expired.',
    }),
  );

export const ResendVerificationDocs = () =>
  applyDecorators(
    ApiOperation({ summary: '🔓 Resend email verification link' }),
    ApiResponse({
      status: 200,
      description: 'Verification email sent.',
      schema: { example: { message: 'Verification email sent.' } },
    }),
    ApiResponse({
      status: 400,
      description: 'Email not found or already verified.',
    }),
    ApiResponse({
      status: 429,
      description: 'Rate limit exceeded (max 3 requests per minute).',
    }),
  );

export const ForgotPasswordDocs = () =>
  applyDecorators(
    ApiOperation({ summary: '🔓 Request a password reset email' }),
    ApiResponse({
      status: 200,
      description: 'If the email exists, a password reset link has been sent.',
      schema: { example: { message: 'Password reset email sent.' } },
    }),
    ApiResponse({
      status: 429,
      description: 'Rate limit exceeded (max 3 requests per minute).',
    }),
  );

export const ResetPasswordDocs = () =>
  applyDecorators(
    ApiOperation({ summary: '🔓 Reset password using token from email' }),
    ApiResponse({
      status: 200,
      description: 'Password updated successfully.',
      schema: {
        example: { message: 'Password has been reset successfully.' },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Token is invalid or has expired.',
    }),
    ApiResponse({
      status: 429,
      description: 'Rate limit exceeded (max 5 requests per minute).',
    }),
  );

export const GoogleLoginDocs = () =>
  applyDecorators(
    ApiOperation({
      summary:
        '🔓 Initiate Google OAuth login — redirects to Google consent screen',
    }),
    ApiResponse({
      status: 302,
      description: 'Redirects to Google OAuth consent screen.',
    }),
  );

export const GoogleCallbackDocs = () =>
  applyDecorators(
    ApiOperation({
      summary: '🔓 Google OAuth callback — handled automatically by Google',
    }),
    ApiResponse({
      status: 200,
      description: `OAuth login successful. ${COOKIES_SET_DESCRIPTION}`,
      schema: { example: { message: 'Login is successful' } },
    }),
    ApiResponse({ status: 401, description: 'Google authentication failed.' }),
  );
