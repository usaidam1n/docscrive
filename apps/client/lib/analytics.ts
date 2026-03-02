import { logger } from './logger';
import { analytics as analyticsConfig, isDevelopment } from './config';

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    umami?: {
      track: (event: string, data?: Record<string, unknown>) => void;
    };
  }
}

export interface AnalyticsEvent {
  name: string;
  category?: string;
  label?: string;
  value?: number;
  custom_parameters?: Record<string, unknown>;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count';
  tags?: Record<string, string>;
}

class Analytics {
  private isInitialized = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initialize();
    }
  }

  private initialize(): void {
    if (this.isInitialized) {
      return;
    }

    // Initialize Umami if configured
    if (analyticsConfig.isUmamiEnabled) {
      this.initializeUmami();
    }

    // Initialize Google Analytics if configured
    if (window.gtag) {
      this.initializeGoogleAnalytics();
    }

    this.isInitialized = true;
    logger.info('Analytics initialized');
  }

  private initializeUmami(): void {
    // Skip manual script creation - handled by UmamiScript component
    // Just log that Umami is configured
    logger.info('Umami analytics configured', {
      websiteId: analyticsConfig.umamiWebsiteId,
      scriptUrl: analyticsConfig.umamiScriptUrl,
    });
  }

  private initializeGoogleAnalytics(): void {
    // Configure Google Analytics if gtag is available
    if (window.gtag) {
      window.gtag('config', 'GA_MEASUREMENT_ID', {
        page_title: document.title,
        page_location: window.location.href,
      });
    }
  }

  // Track custom events
  trackEvent(event: AnalyticsEvent): void {
    if (isDevelopment) {
      logger.debug(
        'Analytics Event (dev mode)',
        event as unknown as Record<string, unknown>
      );
      // Don't return in development - let it track for testing
    }

    try {
      // Track with Umami
      if (window.umami && analyticsConfig.isUmamiEnabled) {
        window.umami.track(event.name, {
          category: event.category,
          label: event.label,
          value: event.value,
          ...event.custom_parameters,
        });
      }

      // Track with Google Analytics
      if (window.gtag) {
        window.gtag('event', event.name, {
          event_category: event.category,
          event_label: event.label,
          value: event.value,
          custom_parameters: event.custom_parameters,
        });
      }

      logger.info('Event tracked', {
        event: event.name,
        category: event.category,
      });
    } catch (error) {
      logger.error('Failed to track event', { event }, error as Error);
    }
  }

  // Track page views
  trackPageView(path: string, title?: string): void {
    if (isDevelopment) {
      logger.debug('Page View (dev mode)', { path, title });
      // Don't return in development - let it track for testing
    }

    try {
      // Track with Umami (automatic if data-auto-track is enabled)
      if (window.umami && analyticsConfig.isUmamiEnabled) {
        window.umami.track('pageview', { path, title });
      }

      // Track with Google Analytics
      if (window.gtag) {
        window.gtag('config', 'GA_MEASUREMENT_ID', {
          page_path: path,
          page_title: title,
        });
      }

      logger.info('Page view tracked', { path, title });
    } catch (error) {
      logger.error(
        'Failed to track page view',
        { path, title },
        error as Error
      );
    }
  }

  // Track performance metrics
  trackPerformance(metric: PerformanceMetric): void {
    if (isDevelopment) {
      logger.debug(
        'Performance Metric (dev mode)',
        metric as unknown as Record<string, unknown>
      );
      // Don't return in development - let it track for testing
    }

    try {
      // Track with custom analytics
      this.trackEvent({
        name: 'performance_metric',
        category: 'performance',
        label: metric.name,
        value: metric.value,
        custom_parameters: {
          unit: metric.unit,
          ...metric.tags,
        },
      });

      logger.performance(metric.name, metric.value, {
        unit: metric.unit,
        ...metric.tags,
      });
    } catch (error) {
      logger.error(
        'Failed to track performance metric',
        metric as unknown as Record<string, unknown>,
        error as Error
      );
    }
  }

  // Track user actions
  trackUserAction(action: string, context?: Record<string, unknown>): void {
    this.trackEvent({
      name: 'user_action',
      category: 'engagement',
      label: action,
      custom_parameters: context,
    });

    logger.userAction(action, undefined, context);
  }

  // Track API calls
  trackApiCall(
    endpoint: string,
    method: string,
    duration: number,
    status: number
  ): void {
    this.trackEvent({
      name: 'api_call',
      category: 'api',
      label: `${method} ${endpoint}`,
      value: duration,
      custom_parameters: {
        method,
        endpoint,
        status,
        duration,
      },
    });
  }

  // Track errors
  trackError(error: Error, context?: Record<string, unknown>): void {
    this.trackEvent({
      name: 'error',
      category: 'error',
      label: error.name,
      custom_parameters: {
        message: error.message,
        stack: error.stack,
        ...context,
      },
    });
  }

  // Track feature usage
  trackFeatureUsage(feature: string, context?: Record<string, unknown>): void {
    this.trackEvent({
      name: 'feature_usage',
      category: 'features',
      label: feature,
      custom_parameters: context,
    });
  }
}

// Performance monitoring utilities
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private analytics: Analytics;

  constructor() {
    this.analytics = new Analytics();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Measure Web Vitals
  measureWebVitals(): void {
    if (typeof window === 'undefined') return;

    // Largest Contentful Paint
    this.observeMetric('largest-contentful-paint', (entry: any) => {
      this.analytics.trackPerformance({
        name: 'lcp',
        value: Math.round(entry.startTime),
        unit: 'ms',
        tags: { vital: 'lcp' },
      });
    });

    // First Input Delay
    this.observeMetric('first-input', (entry: any) => {
      this.analytics.trackPerformance({
        name: 'fid',
        value: Math.round(entry.processingStart - entry.startTime),
        unit: 'ms',
        tags: { vital: 'fid' },
      });
    });

    // Cumulative Layout Shift
    this.observeMetric('layout-shift', (entry: any) => {
      if (!entry.hadRecentInput) {
        this.analytics.trackPerformance({
          name: 'cls',
          value: entry.value,
          unit: 'count',
          tags: { vital: 'cls' },
        });
      }
    });

    // Time to First Byte
    this.measureTTFB();
  }

  private observeMetric(type: string, callback: (entry: any) => void): void {
    try {
      const observer = new PerformanceObserver(list => {
        const entries = list.getEntries();
        entries.forEach(callback);
      });
      observer.observe({ type, buffered: true });
    } catch (error) {
      logger.warn(`Failed to observe ${type} metric`, {
        error: (error as Error).message,
      });
    }
  }

  private measureTTFB(): void {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const navigation = performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming;
      if (navigation) {
        const ttfb = navigation.responseStart - navigation.fetchStart;
        this.analytics.trackPerformance({
          name: 'ttfb',
          value: Math.round(ttfb),
          unit: 'ms',
          tags: { vital: 'ttfb' },
        });
      }
    }
  }

  // Measure component render time
  measureComponentRender<T>(componentName: string, renderFn: () => T): T {
    const start = performance.now();
    const result = renderFn();
    const end = performance.now();

    this.analytics.trackPerformance({
      name: 'component_render',
      value: Math.round(end - start),
      unit: 'ms',
      tags: { component: componentName },
    });

    return result;
  }

  // Measure async operations
  async measureAsync<T>(
    operationName: string,
    asyncFn: () => Promise<T>
  ): Promise<T> {
    const start = performance.now();
    try {
      const result = await asyncFn();
      const end = performance.now();

      this.analytics.trackPerformance({
        name: 'async_operation',
        value: Math.round(end - start),
        unit: 'ms',
        tags: { operation: operationName, status: 'success' },
      });

      return result;
    } catch (error) {
      const end = performance.now();

      this.analytics.trackPerformance({
        name: 'async_operation',
        value: Math.round(end - start),
        unit: 'ms',
        tags: { operation: operationName, status: 'error' },
      });

      throw error;
    }
  }
}

export const analytics = new Analytics();
export const performanceMonitor = PerformanceMonitor.getInstance();

if (typeof window !== 'undefined') {
  performanceMonitor.measureWebVitals();
}
