import { Router, Request, Response } from 'express';
import type { HealthCheckResult } from '../types/index.js';

const router = Router();
const startTime = Date.now();

/**
 * Liveness probe — basic "is the process alive?" check.
 * Use for Kubernetes/ECS liveness probes.
 */
router.get('/', (req: Request, res: Response) => {
  req.log.info('GET /health - Health check accessed');

  const result: HealthCheckResult = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'docscrive-service',
    version: process.env.npm_package_version || '1.1.0',
    uptime: Math.round((Date.now() - startTime) / 1000),
    checks: {
      server: { status: 'pass' },
    },
  };

  return res.status(200).json(result);
});

/**
 * Readiness probe — checks if the service can handle requests.
 * Use for Kubernetes/ECS readiness probes and load balancer health checks.
 */
router.get('/ready', (req: Request, res: Response) => {
  const checks: HealthCheckResult['checks'] = {
    server: { status: 'pass' },
    memory: checkMemory(),
  };

  // Check if any required env vars are configured
  const hasApiSecret = !!process.env.API_SECRET;
  checks.config = hasApiSecret
    ? { status: 'pass' }
    : { status: 'fail', message: 'API_SECRET not configured' };

  const allPassing = Object.values(checks).every(c => c.status === 'pass');

  const result: HealthCheckResult = {
    status: allPassing ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    service: 'docscrive-service',
    version: process.env.npm_package_version || '1.1.0',
    uptime: Math.round((Date.now() - startTime) / 1000),
    checks,
  };

  return res.status(allPassing ? 200 : 503).json(result);
});

function checkMemory(): { status: 'pass' | 'fail'; message?: string } {
  const usage = process.memoryUsage();
  const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);
  const heapPercent = Math.round((usage.heapUsed / usage.heapTotal) * 100);

  if (heapPercent > 90) {
    return {
      status: 'fail',
      message: `Heap usage critical: ${heapUsedMB}MB/${heapTotalMB}MB (${heapPercent}%)`,
    };
  }

  return {
    status: 'pass',
    message: `${heapUsedMB}MB/${heapTotalMB}MB (${heapPercent}%)`,
  };
}

export default router;
