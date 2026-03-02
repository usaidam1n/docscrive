import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { appConfig } from '../config/index.js';
import logger from './logger.js';
import type { DocJobPayload } from '../types/index.js';

const redisUrl = appConfig.queue.redisUrl;

if (!redisUrl || redisUrl.includes('localhost')) {
  logger.warn(
    '⚠️ REDIS_URL is either missing or pointing to localhost. If running in production (Railway/Render), background jobs will fail to connect.'
  );
}

const redisOptions: any = {
  maxRetriesPerRequest: null, // strictly required by BullMQ
  enableReadyCheck: false,
  family: 0, // CRITICAL: allows IPv6/IPv4 DNS resolution on Railway
};

// Automatic TLS handling if the URL explicitly requires it (e.g., Upstash, some AWS ElastiCache)
// Railway's internal Redis network uses standard redis:// (no TLS) so we must NOT force TLS here.
if (redisUrl?.startsWith('rediss://')) {
  redisOptions.tls = { rejectUnauthorized: false };
}

// logger.info(`Connecting to Redis at: ${redisUrl.split('@').pop()}`); // Log host:port safely without password

// const bullConnection = new Redis(redisUrl, redisOptions);

// bullConnection.on("connect", () => logger.info("Redis connected"));
// bullConnection.on("error", (err: Error) =>
//   logger.error({ err }, "Redis connection error")
// );
const bullConnection: any = null; // Mock connection to prevent export errors

// ─── Queue ───────────────────────────────────────────────────────────────────

export type DocQueueName = 'generate-docs';

export const documentationQueue = new Queue<DocJobPayload, void, DocQueueName>(
  appConfig.queue.name,
  {
    connection: bullConnection as any,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 30_000, // 30s → 60s → 120s
      },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 500 },
    },
  }
);

// ─── Enqueue Helper ──────────────────────────────────────────────────────────

/**
 * Enqueue a documentation generation job.
 *
 * Uses the commit SHA as the BullMQ jobId for idempotency — if GitHub retries
 * the same webhook, the duplicate enqueue is silently ignored.
 */
export async function enqueueDocJob(payload: DocJobPayload): Promise<void> {
  const existing = await documentationQueue.getJob(payload.jobId);
  if (existing) {
    logger.info(
      { jobId: payload.jobId, repo: payload.repoFullName },
      'Doc job already enqueued — skipping duplicate'
    );
    return;
  }

  await documentationQueue.add('generate-docs' as DocQueueName, payload, {
    jobId: payload.jobId,
  });

  logger.info(
    {
      jobId: payload.jobId,
      repo: payload.repoFullName,
      branch: payload.branch,
    },
    'Doc job enqueued'
  );
}

// ─── Exported connection config (reused by the worker) ───────────────────────
export { bullConnection };
