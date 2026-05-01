export interface AppConfigInterface {
  DATABASE_URL: string;
  POSTGRES_HOST: string;
  POSTGRES_PORT: number;
  POSTGRES_USER: string;
  POSTGRES_PASSWORD: string;
  POSTGRES_DB: string;

  JWT_SECRET: string;
  NODE_ENV: 'development' | 'production' | 'staging';
}
