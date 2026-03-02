import dotenv from 'dotenv';
dotenv.config();

import { z } from 'zod';

// Environment validation schema
const EnvSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.string().transform(Number).default('3003'),

  // Security — API_SECRET is REQUIRED for HMAC signature validation
  API_SECRET: z
    .string()
    .min(32, 'API_SECRET must be at least 32 characters for security')
    .describe('Secret key for HMAC request signature validation'),
  ALLOWED_ORIGINS: z.string().optional(),

  // External API keys (optional for local development)
  GIT_API_TOKEN: z.string().optional(),

  REDIS_URL: z.string().optional(),
  DATABASE_URL: z.string().optional(),

  // GitHub Webhook
  GITHUB_WEBHOOK_SECRET: z.string().optional(),

  // Worker AI credentials (server-side key for background job processing)
  WORKER_AI_API_KEY: z.string().optional(),
  WORKER_AI_MODEL: z.string().default('gpt-4o'),
  WORKER_AI_PROVIDER: z
    .enum(['openai', 'anthropic', 'gemini'])
    .default('openai'),

  // Logging
  LOG_LEVEL: z
    .enum(['trace', 'debug', 'info', 'warn', 'error'])
    .default('info'),
});

// Parse and validate environment variables — fail fast if misconfigured
const parseEnv = () => {
  try {
    return EnvSchema.parse(process.env);
  } catch (error) {
    // Note: Using console.error here because logger is not initialized yet during startup
    if (error instanceof z.ZodError) {
      console.error('❌ Invalid environment configuration:');
      for (const issue of error.issues) {
        console.error(`   - ${issue.path.join('.')}: ${issue.message}`);
      }
    } else {
      console.error('❌ Invalid environment configuration:', error);
    }
    process.exit(1);
  }
};

export const config = parseEnv();

// Application configuration
export const appConfig = {
  // Server configuration
  server: {
    port: config.PORT,
    timeout: 300000, // 5 minutes
    bodyLimit: '10mb',
  },

  // Security configuration
  security: {
    apiSecret: config.API_SECRET,
    allowedOrigins: config.ALLOWED_ORIGINS?.split(',') || [],
    rateLimiting: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100, // requests per window
      aiEndpointMax: 20, // stricter limit for AI endpoints (expensive calls)
    },
  },

  // AI service configuration
  ai: {
    timeout: 120000, // 2 minutes
    retries: 3,
  },

  // GitHub integration
  github: {
    apiToken: config.GIT_API_TOKEN,
    webhookSecret: config.GITHUB_WEBHOOK_SECRET,
    rateLimit: {
      requests: 5000,
      windowMs: 60 * 60 * 1000, // 1 hour
    },
  },

  // Queue configuration (BullMQ + Redis; optional — background jobs disabled when unset)
  queue: {
    redisUrl: config.REDIS_URL ?? undefined,
    name: 'documentation-queue',
    concurrency: 2,
    worker: {
      apiKey: config.WORKER_AI_API_KEY,
      model: config.WORKER_AI_MODEL,
      provider: config.WORKER_AI_PROVIDER,
    },
  },

  // Logging configuration
  logging: {
    level: config.LOG_LEVEL,
    redactFields: [
      'apiKey',
      'githubToken',
      'token',
      'secret',
      'password',
      'authorization',
    ],
  },
} as const;

export type AppConfig = typeof appConfig;
