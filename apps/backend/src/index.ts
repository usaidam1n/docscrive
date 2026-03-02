import express from 'express';
import { appConfig } from './config/index.js';
import logger from './lib/logger.js';
import { setupMiddleware } from './middleware/index.js';
import router from './routes/index.js';
// import { createDocWorker } from "./workers/doc-worker.js";

// Create Express application
const app = express();
const { port: PORT } = appConfig.server;

// Trust the first proxy (Railway, Render, Heroku, etc.)
// Required for: correct req.ip, rate limiting, secure cookies
app.set('trust proxy', 1);

// Setup middleware
setupMiddleware(app);

// Mount all routes
app.use(router);

// Global error handler
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    logger.error({ error: err }, 'Unhandled application error');

    res.status(500).json({
      error: 'Internal server error',
      message:
        process.env.NODE_ENV === 'development'
          ? err.message
          : 'Something went wrong',
    });
  }
);

// 404 handler
app.use('*', (req: express.Request, res: express.Response) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.originalUrl} not found`,
  });
});

// ─── Boot Sequence ─────────────────────────────────────────────────────────────

let server: ReturnType<typeof app.listen>;
// let docWorker: ReturnType<typeof createDocWorker>;

async function bootstrap() {
  try {
    // 1. (Prisma disabled) DB validation skipped
    // 2. Start the BullMQ documentation worker
    // docWorker = createDocWorker();

    // 3. Start HTTP server only after DB is confirmed reachable
    server = app.listen(PORT, () => {
      logger.info(`🚀 Server is running on port ${PORT}`);
    });

    // Configure server timeouts
    server.keepAliveTimeout = 310000; // 5 minutes + 10 seconds
    server.headersTimeout = 310000;
  } catch (err) {
    logger.fatal({ err }, '❌ Failed during bootstrap sequence (DB or Server)');
    process.exit(1); // Fail the deployment immediately
  }
}

bootstrap();

// ─── Graceful Shutdown ────────────────────────────────────────────────────────

let isShuttingDown = false;

async function gracefulShutdown(signal: string): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  // Close the worker first — lets in-flight jobs finish before we exit
  // if (docWorker) {
  //   await docWorker.close().catch((err) =>
  //     logger.error({ err }, "Error closing doc worker")
  //   );
  // }

  // Stop accepting new connections
  if (server) {
    server.close((err?: Error) => {
      if (err) {
        logger.error({ error: err }, 'Error during server close');
        process.exit(1);
      }

      logger.info('All connections closed. Shutting down.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }

  // Force shutdown after 30 seconds if connections haven't drained
  setTimeout(() => {
    logger.warn('Forced shutdown after 30s timeout');
    process.exit(1);
  }, 30000).unref();
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
