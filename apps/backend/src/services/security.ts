import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import logger from '../lib/logger.js';
import { appConfig } from '../config/index.js';

const ALLOWED_DOMAINS = [
  'http://localhost:3000',
  'http://localhost:3003',
  'https://www.docscrive.com',
  'https://docscrive.com',
  'https://api.docscrive.com',
];

const MAX_REQUEST_AGE = 120 * 1000; // 120 seconds

// Add any custom allowed origins from config
if (appConfig.security.allowedOrigins.length > 0) {
  ALLOWED_DOMAINS.push(...appConfig.security.allowedOrigins);
}

/**
 * Validates incoming API requests using HMAC-SHA256 signature verification.
 *
 * Skips validation for:
 * - Health check endpoints
 * - Development mode (NODE_ENV !== 'production') when origin is missing
 *   (to allow tools like Postman, curl, server-to-server calls)
 *
 * In production, requires:
 * 1. Valid origin header (or no origin for server-to-server)
 * 2. x-timestamp, x-nonce, x-signature headers
 * 3. Timestamp within MAX_REQUEST_AGE to prevent replay attacks
 * 4. Valid HMAC-SHA256 signature
 */
export function validateRequest(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Skip validation for health check endpoints
    if (req.path === '/health' || req.path.startsWith('/health/')) {
      return next();
    }

    // Skip internal HMAC for ANY path containing "webhook"
    // GitHub uses its own x-hub-signature-256 instead
    if (req.path.toLowerCase().includes('webhook')) {
      return next();
    }

    // 1. Check origin
    const origin = req.headers.origin;
    if (origin) {
      // If an Origin header is present, validate it
      if (!ALLOWED_DOMAINS.includes(origin)) {
        logger.warn(
          { origin, path: req.path },
          'Request from disallowed origin'
        );
        return res.status(403).json({ error: 'Invalid origin' });
      }
    } else if (process.env.NODE_ENV === 'production') {
      // In production, server-to-server calls (no Origin) are allowed
      // They still need valid HMAC signatures below
      logger.debug(
        { path: req.path },
        'Server-to-server request (no Origin header)'
      );
    }

    // 2. Check if all required headers are present
    const requiredHeaders = ['x-timestamp', 'x-nonce', 'x-signature'];
    const missingHeaders = requiredHeaders.filter(
      header => !req.headers[header]
    );

    if (missingHeaders.length > 0) {
      return res
        .status(400)
        .json({ error: `Missing headers: ${missingHeaders.join(', ')}` });
    }

    // 3. Validate timestamp to prevent replay attacks
    const timestamp = parseInt(req.headers['x-timestamp'] as string);
    if (isNaN(timestamp)) {
      return res.status(400).json({ error: 'Invalid timestamp format' });
    }

    const now = Date.now();
    if (Math.abs(now - timestamp) > MAX_REQUEST_AGE) {
      return res.status(403).json({ error: 'Request expired' });
    }

    // 4. Validate HMAC-SHA256 signature using the validated API_SECRET
    const computedSignature = generateSignature({
      timestamp: timestamp.toString(),
      nonce: req.headers['x-nonce'] as string,
      body: req.body,
      secret: appConfig.security.apiSecret,
    });

    // Use timing-safe comparison to prevent timing attacks
    const signatureBuffer = Buffer.from(req.headers['x-signature'] as string);
    const computedBuffer = Buffer.from(computedSignature);

    if (
      signatureBuffer.length !== computedBuffer.length ||
      !crypto.timingSafeEqual(signatureBuffer, computedBuffer)
    ) {
      logger.warn({ path: req.path }, 'Invalid signature on request');
      return res.status(403).json({ error: 'Invalid signature' });
    }

    next();
  } catch (error) {
    logger.error({ error }, 'Security validation error');
    res.status(500).json({ error: 'Security validation failed' });
  }
}

interface SignatureParams {
  timestamp: string;
  nonce: string;
  body: unknown;
  secret: string;
}

function generateSignature({
  timestamp,
  nonce,
  body,
  secret,
}: SignatureParams): string {
  const payload = JSON.stringify({
    timestamp,
    nonce,
    body,
  });

  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}
