export const env = {
  PORT: Number(process.env.PORT) || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/nolimits_db',
  JWT_SECRET: process.env.JWT_SECRET || '',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
};
