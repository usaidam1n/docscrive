import { withRetry } from '../src/lib/retry';

// Mock the logger to prevent actual log output during tests
jest.mock('../src/lib/logger.js', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn(),
  },
}));

describe('withRetry', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return result on first successful call', async () => {
    const fn = jest.fn().mockResolvedValue('success');
    const result = await withRetry(fn, 'test');
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on retryable error and succeed', async () => {
    const error = new Error('temporary');
    (error as any).status = 429; // rate limit
    const fn = jest
      .fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValue('success');

    // We need real timers for the sleep to work
    jest.useRealTimers();
    const result = await withRetry(fn, 'test', {
      maxRetries: 2,
      baseDelayMs: 10,
      maxDelayMs: 50,
    });
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should not retry on non-retryable error (4xx)', async () => {
    const error = new Error('bad request');
    (error as any).status = 400;
    const fn = jest.fn().mockRejectedValue(error);

    await expect(withRetry(fn, 'test', { maxRetries: 3 })).rejects.toThrow(
      'bad request'
    );
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on 500 server errors', async () => {
    const error = new Error('server error');
    (error as any).status = 500;
    const fn = jest.fn().mockRejectedValue(error);

    jest.useRealTimers();
    await expect(
      withRetry(fn, 'test', {
        maxRetries: 2,
        baseDelayMs: 10,
        maxDelayMs: 50,
      })
    ).rejects.toThrow('server error');
    expect(fn).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
  });

  it('should retry on network errors (ECONNRESET)', async () => {
    const error = new Error('connection reset');
    (error as any).code = 'ECONNRESET';
    const fn = jest
      .fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValue('recovered');

    jest.useRealTimers();
    const result = await withRetry(fn, 'test', {
      maxRetries: 2,
      baseDelayMs: 10,
      maxDelayMs: 50,
    });
    expect(result).toBe('recovered');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should respect maxRetries limit', async () => {
    const error = new Error('overloaded');
    (error as any).status = 503;
    const fn = jest.fn().mockRejectedValue(error);

    jest.useRealTimers();
    await expect(
      withRetry(fn, 'test', {
        maxRetries: 1,
        baseDelayMs: 10,
        maxDelayMs: 50,
      })
    ).rejects.toThrow('overloaded');
    expect(fn).toHaveBeenCalledTimes(2); // 1 initial + 1 retry
  });
});
