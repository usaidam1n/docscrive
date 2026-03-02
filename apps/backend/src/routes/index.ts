import { Router } from 'express';
import healthRouter from './health.js';
import documentRouter from './document.js';
import translationRouter from './translation.js';
import analysisRouter from './analysis.js';
import metricsRouter from './metrics.js';
import openapiRouter from './openapi.js';
import webhooksRouter from './webhooks.js';
import authRouter from './auth.js';

const router = Router();

// Health check endpoint
router.use('/health', healthRouter);

// Observability
router.use('/metrics', metricsRouter);

// API documentation
router.use('/api/docs', openapiRouter);

// Webhooks — mounted before other API routes; uses own raw-body parser + GitHub HMAC
// Webhooks temporarily disabled
// router.use("/api/webhooks/github", webhooksRouter);
// router.use("/api/webhook/github", webhooksRouter); // Aliased for common typos

// Auth
router.use('/api/auth', authRouter);

// API routes
router.use('/api/generate-document', documentRouter);
router.use('/api/translate-code', translationRouter);
router.use('/api/analyze-code', analysisRouter);

export default router;
