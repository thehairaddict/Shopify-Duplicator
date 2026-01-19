import dotenv from 'dotenv';

dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  
  database: {
    url: process.env.DATABASE_URL,
  },
  
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  
  security: {
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
    encryptionKey: process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    sessionSecret: process.env.SESSION_SECRET || 'dev-session-secret',
  },
  
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
  
  shopify: {
    restMaxRequestsPerSecond: parseInt(process.env.SHOPIFY_REST_MAX_REQUESTS_PER_SECOND || '2', 10),
    graphqlMaxCostPerSecond: parseInt(process.env.SHOPIFY_GRAPHQL_MAX_COST_PER_SECOND || '50', 10),
    apiVersion: '2024-01',
  },
  
  queue: {
    concurrency: parseInt(process.env.BULL_CONCURRENCY || '5', 10),
  },
};
