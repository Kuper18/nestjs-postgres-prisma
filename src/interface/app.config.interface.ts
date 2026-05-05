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

  CLIENT_URL: string;
}
