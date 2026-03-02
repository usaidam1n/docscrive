import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import logger from '../lib/logger.js';
import { appConfig } from '../config/index.js';
import { validateRequest } from '../services/security.js';
import { recordRequest } from '../routes/metrics.js';

// Augment Express Request with custom properties (namespace required for module augmentation)
/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace Express {
    interface Request {
      requestId: string;
      log: typeof logger;
    }
  }
}

/**
 * Sensitive field names to redact from logged request bodies.
 * Values are replaced with "[REDACTED]" before logging.
 */
const REDACT_FIELDS: Set<string> = new Set(appConfig.logging.redactFields);

/**
 * Deep-redact sensitive fields from an object for safe logging.
 * Returns a new object — does NOT mutate the original.
 */
function redactSensitiveFields(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(item => redactSensitiveFields(item));
  }

  const redacted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (REDACT_FIELDS.has(key.toLowerCase())) {
      redacted[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      redacted[key] = redactSensitiveFields(value);
    } else {
      redacted[key] = value;
    }
  }
  return redacted;
}

export const setupMiddleware = (app: express.Application): void => {
  // Body parsing middleware
  // We MUST skip parsing JSON for webhooks because GitHub HMAC validation
  // requires the raw Buffer exactly as transmitted globally.
  app.use((req, res, next) => {
    if (req.path.toLowerCase().includes('webhook')) {
      return next(); // Skip body parsing, let the webhook route handle raw body
    }
    express.json({ limit: '10mb' })(req, res, next);
  });

  app.use((req, res, next) => {
    if (req.path.toLowerCase().includes('webhook')) {
      return next();
    }
    express.urlencoded({ extended: true, limit: '10mb' })(req, res, next);
  });

  // ─── Rate Limiting ──────────────────────────────────────────────────────────

  // General rate limiter — applies to all routes
  const generalLimiter = rateLimit({
    windowMs: appConfig.security.rateLimiting.windowMs,
    max: appConfig.security.rateLimiting.maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
    },
  });

  // Stricter rate limiter for AI endpoints (expensive API calls)
  const aiLimiter = rateLimit({
    windowMs: appConfig.security.rateLimiting.windowMs,
    max: appConfig.security.rateLimiting.aiEndpointMax,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: 'Too many AI requests',
      message:
        'AI endpoint rate limit exceeded. These calls are expensive — please slow down.',
    },
  });

  // Apply general limiter to all routes
  app.use(generalLimiter);

  // Apply stricter limiter to AI-heavy endpoints
  app.use('/api/generate-document', aiLimiter);
  app.use('/api/translate-code', aiLimiter);
  app.use('/api/analyze-code', aiLimiter);

  // ─── Request Logging (with redaction) ───────────────────────────────────────

  app.use((req, res, next) => {
    const startTime = Date.now();
    const requestId = crypto.randomUUID();

    // Attach typed properties to request
    req.requestId = requestId;
    req.log = logger;

    // Log request start — REDACT sensitive fields from body
    logger.info(
      {
        type: 'REQUEST_START',
        requestId,
        method: req.method,
        path: req.path,
        query: req.query,
        body: redactSensitiveFields(req.body),
        userAgent: req.get('User-Agent'),
        contentType: req.get('Content-Type'),
        contentLength: req.get('Content-Length'),
        ip: req.ip,
      },
      `[${requestId}] ${req.method} ${req.path}`
    );

    // Override res.json to log response
    const originalJson = res.json;
    res.json = function (data) {
      const duration = Date.now() - startTime;
      const responseSize = JSON.stringify(data).length;

      // Record metrics
      recordRequest(req.path, res.statusCode, duration);

      logger.info(
        {
          type: 'REQUEST_END',
          requestId,
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration,
          responseSize,
        },
        `[${requestId}] ${res.statusCode} ${req.method} ${req.path} - ${duration}ms, ${responseSize} bytes`
      );

      return originalJson.call(this, data);
    };

    next();
  });

  // ─── CORS ───────────────────────────────────────────────────────────────────

  app.use(
    cors({
      origin:
        process.env.NODE_ENV === 'production'
          ? process.env.ALLOWED_ORIGINS?.split(',') || [
              'https://www.docscrive.com',
              'https://docscrive.com',
              'https://api.docscrive.com',
            ]
          : true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'x-timestamp',
        'x-nonce',
        'x-signature',
      ],
    })
  );

  // ─── Security (HMAC Signature Validation) ───────────────────────────────────

  app.use(validateRequest);

  // ─── Request Timeout ────────────────────────────────────────────────────────

  app.use((req, res, next) => {
    res.setTimeout(300000, () => {
      // 5 minute timeout
      res.status(408).json({
        error: 'Request timeout',
        message: 'Request took too long to process',
      });
    });
    next();
  });
};
