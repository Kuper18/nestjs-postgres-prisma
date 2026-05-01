import * as z from 'zod';

export const envValidationSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'staging'])
    .default('development'),
  PORT: z.coerce.number().default(3000),
  JWT_SECRET: z.string(),
  DATABASE_URL: z.string(),
  POSTGRES_USER: z.string(),
  POSTGRES_PASSWORD: z.string(),
  POSTGRES_HOST: z.string(),
  POSTGRES_PORT: z.coerce.number(),
  POSTGRES_DB: z.string(),
});
