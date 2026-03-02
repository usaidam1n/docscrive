import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  NEXT_PUBLIC_APP_ENV: z
    .enum(['development', 'staging', 'production'])
    .default('development'),
  NEXT_PUBLIC_API_SECRET: z.string().optional(),
  NEXT_PUBLIC_DOCSCRIVE_API: z.string().url().optional(),
  NEXT_PUBLIC_UMAMI_SCRIPT_URL: z.string().url().optional(),
  NEXT_PUBLIC_UMAMI_WEBSITE_ID: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),

  NEXT_PUBLIC_GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GITHUB_REDIRECT_URI: z.string().url().optional(),
  GITHUB_WEBHOOK_SECRET: z.string().optional(),

  DATABASE_URL: z.string().url().optional(),
  REDIS_URL: z.string().url().optional(),

  RATE_LIMIT_MAX: z.coerce.number().positive().default(100),
  RATE_LIMIT_WINDOW: z.coerce.number().positive().default(900000),
  GITHUB_RATE_LIMIT_MAX: z.coerce.number().positive().default(5000),
  GITHUB_RATE_LIMIT_WINDOW: z.coerce.number().positive().default(3600000),

  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FORMAT: z.enum(['json', 'pretty']).default('json'),

  SECURITY_HEADERS_ENABLED: z.coerce.boolean().default(true),
  CSP_ENABLED: z.coerce.boolean().default(true),
  JWT_SECRET: z.string().optional(),

  ENABLE_CACHE: z.coerce.boolean().default(true),
  CACHE_TTL: z.coerce.number().positive().default(3600),
  REPOSITORY_CACHE_TTL: z.coerce.number().positive().default(1800),

  MAX_REPOSITORY_SIZE_MB: z.coerce.number().positive().default(500),
  MAX_FILES_PER_REPO: z.coerce.number().positive().default(1000),
  MAX_PROCESSING_TIME_MINUTES: z.coerce.number().positive().default(30),
});

type Env = z.infer<typeof envSchema>;

class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

let config: Env;

try {
  config = envSchema.parse(process.env);

  // In production, require explicit secrets instead of falling back
  if (config.NODE_ENV === 'production') {
    if (!config.NEXT_PUBLIC_API_SECRET) {
      throw new ConfigError(
        'NEXT_PUBLIC_API_SECRET must be set in production for request signing.'
      );
    }
    if (!config.JWT_SECRET) {
      throw new ConfigError(
        'JWT_SECRET must be set in production for secure session handling.'
      );
    }
  }
} catch (error) {
  if (error instanceof z.ZodError) {
    const errorMessages = error.issues.map(
      err => `${err.path.join('.')}: ${err.message}`
    );
    throw new ConfigError(
      `Invalid environment configuration:\n${errorMessages.join('\n')}`
    );
  }
  throw error;
}

export { config };

export const isDevelopment = config.NODE_ENV === 'development';
export const isProduction = config.NODE_ENV === 'production';
export const isTest = config.NODE_ENV === 'test';

export const apiConfig = {
  baseUrl: config.NEXT_PUBLIC_DOCSCRIVE_API,
  // In development we allow a simple default; in production config.NEXT_PUBLIC_API_SECRET is required
  secret:
    config.NEXT_PUBLIC_API_SECRET ||
    (config.NODE_ENV === 'development' ? 'development-secret' : ''),
  timeout: 30000,
  isConfigured: !!(
    config.NEXT_PUBLIC_DOCSCRIVE_API && config.NEXT_PUBLIC_API_SECRET
  ),
} as const;

export const rateLimit = {
  max: config.RATE_LIMIT_MAX,
  windowMs: config.RATE_LIMIT_WINDOW,
} as const;

export const logging = {
  level: config.LOG_LEVEL,
  format: config.LOG_FORMAT,
} as const;

export const security = {
  headersEnabled: config.SECURITY_HEADERS_ENABLED,
  cspEnabled: config.CSP_ENABLED,
} as const;

export const cache = {
  enabled: config.ENABLE_CACHE,
  ttl: config.CACHE_TTL,
} as const;

export const analytics = {
  umamiScriptUrl: config.NEXT_PUBLIC_UMAMI_SCRIPT_URL,
  umamiWebsiteId: config.NEXT_PUBLIC_UMAMI_WEBSITE_ID,
  sentryDsn: config.NEXT_PUBLIC_SENTRY_DSN,
  isUmamiEnabled: !!(
    config.NEXT_PUBLIC_UMAMI_SCRIPT_URL && config.NEXT_PUBLIC_UMAMI_WEBSITE_ID
  ),
} as const;

export const github = {
  clientId: config.NEXT_PUBLIC_GITHUB_CLIENT_ID || '',
  clientSecret: config.GITHUB_CLIENT_SECRET || '',
  redirectUri: config.GITHUB_REDIRECT_URI,
  webhookSecret: config.GITHUB_WEBHOOK_SECRET,
  baseUrl: 'https://api.github.com',
  authUrl: 'https://github.com/login/oauth',
  scopes: ['repo', 'user:email', 'read:org'],
  rateLimit: {
    max: config.GITHUB_RATE_LIMIT_MAX,
    windowMs: config.GITHUB_RATE_LIMIT_WINDOW,
  },
  isConfigured: !!(
    config.NEXT_PUBLIC_GITHUB_CLIENT_ID && config.GITHUB_CLIENT_SECRET
  ),
} as const;

export const processing = {
  maxRepositorySizeMB: config.MAX_REPOSITORY_SIZE_MB,
  maxFilesPerRepo: config.MAX_FILES_PER_REPO,
  maxProcessingTimeMinutes: config.MAX_PROCESSING_TIME_MINUTES,
  repositoryCacheTtl: config.REPOSITORY_CACHE_TTL,
} as const;

export const jwt = {
  // In production, JWT_SECRET is required (see config validation above)
  secret:
    config.JWT_SECRET ||
    'fallback-secret-for-development-only-change-in-production',
  expiresIn: '7d',
  issuer: 'docscrive',
  algorithm: 'HS256' as const,
} as const;
