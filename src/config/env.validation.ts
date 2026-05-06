import * as z from 'zod';

export const envValidationSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'staging'])
    .default('development'),
  PORT: z.coerce.number().default(3000),
  COOKIE_DOMAIN: z.string(),

  DATABASE_URL: z.string(),
  POSTGRES_USER: z.string(),
  POSTGRES_PASSWORD: z.string(),
  POSTGRES_HOST: z.string(),
  POSTGRES_PORT: z.coerce.number(),
  POSTGRES_DB: z.string(),

  JWT_SECRET: z.string(),
  JWT_ACCESS_TOKEN_TTL: z.string(),
  JWT_REFRESH_TOKEN_TTL: z.string(),

  // mail
  MAIL_HOST: z.string(),
  MAIL_PORT: z.coerce.number(),
  MAIL_PASSWORD: z.string(),
  MAIL_FROM: z.string(),
  MAIL_USER: z.string(),

  // client
  CLIENT_URL: z.url(),
});
