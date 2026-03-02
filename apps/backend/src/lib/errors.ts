export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class AIProviderError extends AppError {
  constructor(
    message: string,
    public details?: any
  ) {
    super(message, 502); // Bad Gateway
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    public details?: any
  ) {
    super(message, 400); // Bad Request
  }
}

export class AnalysisError extends AppError {
  constructor(
    message: string,
    public details?: any
  ) {
    super(message, 500); // Internal Server Error
  }
}
