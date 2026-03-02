import crypto from 'crypto';
import logger from './logger.js';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  size: number;
}

/**
 * Simple in-memory LRU + TTL cache.
 * No external dependencies — just a Map with eviction.
 *
 * Usage:
 *   const cached = responseCache.get(key);
 *   if (cached) return cached;
 *   const result = await expensiveCall();
 *   responseCache.set(key, result);
 */
class LRUCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private readonly maxEntries: number;
  private readonly defaultTTLMs: number;

  // Stats
  private _hits = 0;
  private _misses = 0;

  constructor(maxEntries = 50, defaultTTLMs = 60 * 60 * 1000) {
    this.maxEntries = maxEntries;
    this.defaultTTLMs = defaultTTLMs;
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      this._misses++;
      return null;
    }

    // Check expiration
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this._misses++;
      return null;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);
    this._hits++;
    return entry.value;
  }

  set(key: string, value: T, ttlMs?: number): void {
    // Evict if at capacity
    if (this.cache.size >= this.maxEntries) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
        logger.debug({ evictedKey: oldestKey }, 'Cache eviction');
      }
    }

    const serialized = JSON.stringify(value);
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + (ttlMs || this.defaultTTLMs),
      size: serialized.length,
    });
  }

  get stats() {
    return {
      entries: this.cache.size,
      maxEntries: this.maxEntries,
      hits: this._hits,
      misses: this._misses,
      hitRate:
        this._hits + this._misses > 0
          ? Math.round((this._hits / (this._hits + this._misses)) * 100)
          : 0,
    };
  }

  clear(): void {
    this.cache.clear();
    this._hits = 0;
    this._misses = 0;
  }
}

/**
 * Generate a cache key from input parameters.
 * Uses SHA-256 hash so keys are fixed-length and safe for any input size.
 */
export function makeCacheKey(...parts: unknown[]): string {
  const hash = crypto.createHash('sha256');
  for (const part of parts) {
    hash.update(typeof part === 'string' ? part : JSON.stringify(part));
  }
  return hash.digest('hex');
}

// Singleton response cache: 50 entries, 1-hour TTL
export const responseCache = new LRUCache<unknown>(50, 60 * 60 * 1000);
