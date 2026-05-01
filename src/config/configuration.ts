export default () => ({
  // Database
  POSTGRES_HOST: process.env.POSTGRES_HOST,
  POSTGRES_PORT: parseInt(process.env.POSTGRES_PORT || '', 10) || 5432,
  POSTGRES_USER: process.env.POSTGRES_USER,
  POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD,
  POSTGRES_DB: process.env.POSTGRES_DB,
  DATABASE_URL: process.env.DATABASE_URL,

  // Auth
  JWT_SECRET: process.env.JWT_SECRET,

  // App
  NODE_ENV: process.env.NODE_ENV || 'development',
});
