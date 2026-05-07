export interface AppConfigInterface {
  DATABASE_URL: string;
  POSTGRES_HOST: string;
  POSTGRES_PORT: number;
  POSTGRES_USER: string;
  POSTGRES_PASSWORD: string;
  POSTGRES_DB: string;

  NODE_ENV: 'development' | 'production' | 'staging';
  COOKIE_DOMAIN: string;

  JWT_SECRET: string;
  JWT_ACCESS_TOKEN_TTL: string;
  JWT_REFRESH_TOKEN_TTL: string;

  MAIL_HOST: string;
  MAIL_PORT: number;
  MAIL_PASSWORD: string;
  MAIL_FROM: string;
  MAIL_USER: string;

  CLIENT_URL: string;

  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_CALLBACK_URL: string;
}
