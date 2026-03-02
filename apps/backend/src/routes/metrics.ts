import { Router, Request, Response } from 'express';
import { responseCache } from '../lib/cache.js';

const router = Router();

/**
 * In-memory metrics collector.
 * Tracks request counts, response times, and AI provider usage.
 * No external dependencies — lightweight enough for single-instance deployments.
 */
interface EndpointMetrics {
  requests: number;
  errors: number;
  totalDurationMs: number;
}

const metrics: Record<string, EndpointMetrics> = {};
const aiMetrics = {
  calls: 0,
  errors: 0,
  totalDurationMs: 0,
  byProvider: {} as Record<
    string,
    { calls: number; errors: number; totalDurationMs: number }
  >,
};

const startTime = Date.now();

/**
 * Record a request metric. Called from middleware.
 */
export function recordRequest(
  path: string,
  statusCode: number,
  durationMs: number
): void {
  // Normalize path to avoid cardinality explosion
  const normalizedPath = normalizePath(path);

  if (!metrics[normalizedPath]) {
    metrics[normalizedPath] = { requests: 0, errors: 0, totalDurationMs: 0 };
  }

  metrics[normalizedPath].requests++;
  metrics[normalizedPath].totalDurationMs += durationMs;

  if (statusCode >= 400) {
    metrics[normalizedPath].errors++;
  }
}

/**
 * Record an AI provider call metric.
 */
export function recordAICall(
  provider: string,
  durationMs: number,
  isError: boolean
): void {
  aiMetrics.calls++;
  aiMetrics.totalDurationMs += durationMs;

  if (isError) aiMetrics.errors++;

  if (!aiMetrics.byProvider[provider]) {
    aiMetrics.byProvider[provider] = {
      calls: 0,
      errors: 0,
      totalDurationMs: 0,
    };
  }

  aiMetrics.byProvider[provider].calls++;
  aiMetrics.byProvider[provider].totalDurationMs += durationMs;
  if (isError) aiMetrics.byProvider[provider].errors++;
}

/**
 * Normalize paths to avoid high-cardinality metric names.
 */
function normalizePath(path: string): string {
  if (path.startsWith('/api/generate-document'))
    return '/api/generate-document';
  if (path.startsWith('/api/translate-code')) return '/api/translate-code';
  if (path.startsWith('/api/analyze-code')) return '/api/analyze-code';
  if (path.startsWith('/health')) return '/health';
  return path;
}

/**
 * GET /metrics — returns JSON metrics for monitoring.
 */
router.get('/', (_req: Request, res: Response) => {
  const memUsage = process.memoryUsage();

  const endpointStats = Object.entries(metrics).map(([path, m]) => ({
    path,
    requests: m.requests,
    errors: m.errors,
    errorRate: m.requests > 0 ? Math.round((m.errors / m.requests) * 100) : 0,
    avgDurationMs:
      m.requests > 0 ? Math.round(m.totalDurationMs / m.requests) : 0,
  }));

  const providerStats = Object.entries(aiMetrics.byProvider).map(
    ([provider, m]) => ({
      provider,
      calls: m.calls,
      errors: m.errors,
      errorRate: m.calls > 0 ? Math.round((m.errors / m.calls) * 100) : 0,
      avgDurationMs: m.calls > 0 ? Math.round(m.totalDurationMs / m.calls) : 0,
    })
  );

  res.json({
    uptime: {
      seconds: Math.round((Date.now() - startTime) / 1000),
      startedAt: new Date(startTime).toISOString(),
    },
    memory: {
      heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024),
      rssMB: Math.round(memUsage.rss / 1024 / 1024),
    },
    endpoints: endpointStats,
    ai: {
      totalCalls: aiMetrics.calls,
      totalErrors: aiMetrics.errors,
      avgDurationMs:
        aiMetrics.calls > 0
          ? Math.round(aiMetrics.totalDurationMs / aiMetrics.calls)
          : 0,
      providers: providerStats,
    },
    cache: responseCache.stats,
  });
});

export default router;
