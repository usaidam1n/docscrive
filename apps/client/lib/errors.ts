import { logger } from './logger';

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    code: string = 'UNKNOWN_ERROR',
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: Record<string, unknown>
  ) {
    super(message);

    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 400, true, context);
  }
}

export class AuthenticationError extends AppError {
  constructor(
    message: string = 'Authentication failed',
    context?: Record<string, unknown>
  ) {
    super(message, 'AUTHENTICATION_ERROR', 401, true, context);
  }
}

export class AuthorizationError extends AppError {
  constructor(
    message: string = 'Access denied',
    context?: Record<string, unknown>
  ) {
    super(message, 'AUTHORIZATION_ERROR', 403, true, context);
  }
}

export class NotFoundError extends AppError {
  constructor(
    resource: string = 'Resource',
    context?: Record<string, unknown>
  ) {
    super(`${resource} not found`, 'NOT_FOUND_ERROR', 404, true, context);
  }
}

export class RateLimitError extends AppError {
  constructor(
    message: string = 'Rate limit exceeded',
    context?: Record<string, unknown>
  ) {
    super(message, 'RATE_LIMIT_ERROR', 429, true, context);
  }
}

export class ExternalServiceError extends AppError {
  constructor(
    service: string,
    message: string,
    context?: Record<string, unknown>
  ) {
    super(
      `${service} service error: ${message}`,
      'EXTERNAL_SERVICE_ERROR',
      502,
      true,
      context
    );
  }
}

export class ConfigurationError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'CONFIGURATION_ERROR', 500, false, context);
  }
}

// Error handler utility
export function handleError(
  error: unknown,
  context?: Record<string, unknown>
): AppError {
  // If it's already an AppError, just log and return
  if (error instanceof AppError) {
    logger.error(
      error.message,
      {
        code: error.code,
        statusCode: error.statusCode,
        ...error.context,
        ...context,
      },
      error
    );
    return error;
  }

  // If it's a standard Error
  if (error instanceof Error) {
    const appError = new AppError(
      error.message,
      'UNKNOWN_ERROR',
      500,
      false,
      context
    );

    logger.error(error.message, context, error);
    return appError;
  }

  // If it's something else (string, object, etc.)
  const message =
    typeof error === 'string' ? error : 'An unknown error occurred';
  const appError = new AppError(message, 'UNKNOWN_ERROR', 500, false, context);

  logger.error(message, { originalError: error, ...context });
  return appError;
}

// Async error wrapper
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: Record<string, unknown>
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      throw handleError(error, context);
    }
  }) as T;
}

// React error boundary helper
export function getErrorInfo(
  error: Error,
  errorInfo?: { componentStack: string }
) {
  const errorDetails = {
    message: error.message,
    stack: error.stack,
    componentStack: errorInfo?.componentStack,
    timestamp: new Date().toISOString(),
  };

  logger.error('React Error Boundary', errorDetails, error);

  return errorDetails;
}

// API response error parser
export function parseApiError(response: any): AppError {
  const message = response?.message || response?.error || 'API request failed';
  const code = response?.code || 'API_ERROR';
  const statusCode = response?.status || response?.statusCode || 500;

  return new AppError(message, code, statusCode, true, {
    response: response,
  });
}

// Network error handler
export function handleNetworkError(error: any): AppError {
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return new AppError('Request timed out', 'TIMEOUT_ERROR', 408, true);
  }

  if (error.code === 'NETWORK_ERROR' || !navigator.onLine) {
    return new AppError(
      'Network connection failed',
      'NETWORK_ERROR',
      503,
      true
    );
  }

  return handleError(error, { type: 'network' });
}

// Development helper to format errors nicely
export function formatErrorForDev(error: AppError): string {
  return `
🚨 ${error.name}: ${error.message}
📋 Code: ${error.code}
🔢 Status: ${error.statusCode}
🔧 Operational: ${error.isOperational}
${error.context ? `📝 Context: ${JSON.stringify(error.context, null, 2)}` : ''}
${error.stack ? `📍 Stack:\n${error.stack}` : ''}
  `.trim();
}
