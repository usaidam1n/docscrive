import { logging, isDevelopment } from './config';

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

interface LogEntry {
  level: keyof typeof LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  userId?: string;
  sessionId?: string;
  requestId?: string;
}

class Logger {
  private level: LogLevel;
  private format: 'json' | 'pretty';

  constructor() {
    this.level = LogLevel[logging.level.toUpperCase() as keyof typeof LogLevel];
    this.format = logging.format;
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.level;
  }

  private formatMessage(entry: LogEntry): string {
    if (this.format === 'json') {
      return JSON.stringify(entry);
    }

    const timestamp = entry.timestamp;
    const level = entry.level.padEnd(5);
    const message = entry.message;
    const context = entry.context ? ` ${JSON.stringify(entry.context)}` : '';
    const error = entry.error?.stack ? `\n${entry.error.stack}` : '';

    return `[${timestamp}] ${level} ${message}${context}${error}`;
  }

  private log(
    level: keyof typeof LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error
  ): void {
    const logLevel = LogLevel[level];

    if (!this.shouldLog(logLevel)) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      }),
    };

    const formattedMessage = this.formatMessage(entry);

    // In development, use console methods for better DevTools integration
    if (isDevelopment) {
      switch (level) {
        case 'ERROR':
          console.error(formattedMessage);
          break;
        case 'WARN':
          console.warn(formattedMessage);
          break;
        case 'INFO':
          console.info(formattedMessage);
          break;
        case 'DEBUG':
          console.debug(formattedMessage);
          break;
      }
    } else {
      // In production, use console.log to ensure consistent formatting
      console.log(formattedMessage);
    }

    // Send to external logging service in production
    if (!isDevelopment && level === 'ERROR') {
      this.sendToExternalService(entry);
    }
  }

  private sendToExternalService(entry: LogEntry): void {
    // Implementation for external logging service (e.g., Sentry, DataDog, etc.)
    // This would be async in a real implementation
    try {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'exception', {
          description: entry.message,
          fatal: false,
        });
      }
    } catch (error) {
      // Avoid infinite loops in logging
      console.error('Failed to send log to external service:', error);
    }
  }

  error(
    message: string,
    context?: Record<string, unknown>,
    error?: Error
  ): void {
    this.log('ERROR', message, context, error);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log('WARN', message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log('INFO', message, context);
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.log('DEBUG', message, context);
  }

  // Utility methods for common logging patterns
  apiRequest(
    method: string,
    url: string,
    statusCode?: number,
    duration?: number
  ): void {
    this.info('API Request', {
      method,
      url,
      statusCode,
      duration,
    });
  }

  apiError(
    method: string,
    url: string,
    error: Error,
    statusCode?: number
  ): void {
    this.error(
      'API Error',
      {
        method,
        url,
        statusCode,
      },
      error
    );
  }

  userAction(
    action: string,
    userId?: string,
    context?: Record<string, unknown>
  ): void {
    this.info('User Action', {
      action,
      userId,
      ...context,
    });
  }

  performance(
    metric: string,
    value: number,
    context?: Record<string, unknown>
  ): void {
    this.info('Performance Metric', {
      metric,
      value,
      ...context,
    });
  }
}

export const logger = new Logger();

// Global error handlers
if (typeof window !== 'undefined') {
  window.addEventListener('error', event => {
    logger.error(
      'Unhandled Error',
      {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
      event.error
    );
  });

  window.addEventListener('unhandledrejection', event => {
    logger.error('Unhandled Promise Rejection', {
      reason: event.reason,
    });
  });
}
