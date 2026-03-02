import type { DocumentationConfiguration } from '../types/documentation';
import type { GitHubRepository } from '../types/github';

// Storage schema versioning for future migrations
const STORAGE_VERSION = '1.0.0';
const STORAGE_KEYS = {
  GLOBAL_CONFIG: 'docscrive_global_config',
  USER_CONFIGS: 'docscrive_user_configs',
  REPO_CONFIGS: 'docscrive_repo_configs',
  RECENT_CONFIGS: 'docscrive_recent_configs',
  METADATA: 'docscrive_config_metadata',
} as const;

interface StorageMetadata {
  version: string;
  lastUpdated: string;
  totalConfigs: number;
  userId?: string;
}

interface SavedConfiguration extends DocumentationConfiguration {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  repositoryId?: string;
  repositoryName?: string;
  userId?: string;
  tags: string[];
  usage: {
    timesUsed: number;
    lastUsed: string;
    successRate: number;
  };
}

interface ConfigComparisonResult {
  areEqual: boolean;
  differences: Array<{
    path: string;
    oldValue: any;
    newValue: any;
    severity: 'low' | 'medium' | 'high';
  }>;
  similarityScore: number;
}

class GitHubConfigurationManager {
  private cache = new Map<string, SavedConfiguration>();
  private isInitialized = false;

  constructor() {
    this.initializeStorage();
  }

  /**
   * Initialize storage and handle migrations
   */
  private initializeStorage(): void {
    try {
      if (typeof window === 'undefined') return;

      const metadata = this.getStorageMetadata();

      // Handle version migrations if needed
      if (!metadata || metadata.version !== STORAGE_VERSION) {
        this.migrateStorage(metadata);
      }

      // Load configurations into cache
      this.loadCache();
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize config storage:', error);
      this.handleStorageError(error);
    }
  }

  /**
   * Get storage metadata
   */
  private getStorageMetadata(): StorageMetadata | null {
    try {
      const metadata = localStorage.getItem(STORAGE_KEYS.METADATA);
      return metadata ? JSON.parse(metadata) : null;
    } catch {
      return null;
    }
  }

  /**
   * Update storage metadata
   */
  private updateStorageMetadata(updates: Partial<StorageMetadata>): void {
    try {
      const current = this.getStorageMetadata() || {
        version: STORAGE_VERSION,
        lastUpdated: new Date().toISOString(),
        totalConfigs: 0,
      };

      const updated = {
        ...current,
        ...updates,
        lastUpdated: new Date().toISOString(),
      };

      localStorage.setItem(STORAGE_KEYS.METADATA, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to update storage metadata:', error);
    }
  }

  /**
   * Handle storage version migrations
   */
  private migrateStorage(oldMetadata: StorageMetadata | null): void {
    console.log('Migrating configuration storage...', { oldMetadata });

    // For now, just update metadata. Future versions can add migration logic
    this.updateStorageMetadata({
      version: STORAGE_VERSION,
      totalConfigs: 0,
    });
  }

  /**
   * Load configurations into cache
   */
  private loadCache(): void {
    try {
      const globalConfigs =
        this.getStorageItem<SavedConfiguration[]>(STORAGE_KEYS.GLOBAL_CONFIG) ||
        [];
      const userConfigs =
        this.getStorageItem<SavedConfiguration[]>(STORAGE_KEYS.USER_CONFIGS) ||
        [];
      const repoConfigs =
        this.getStorageItem<SavedConfiguration[]>(STORAGE_KEYS.REPO_CONFIGS) ||
        [];

      this.cache.clear();
      [...globalConfigs, ...userConfigs, ...repoConfigs].forEach(config => {
        this.cache.set(config.id, config);
      });
    } catch (error) {
      console.error('Failed to load cache:', error);
    }
  }

  /**
   * Safe localStorage operations
   */
  private getStorageItem<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }

  private setStorageItem<T>(key: string, value: T): boolean {
    try {
      // Sanitize the value to remove any circular references or non-serializable data
      const sanitizedValue = this.sanitizeForStorage(value);
      localStorage.setItem(key, JSON.stringify(sanitizedValue));
      return true;
    } catch (error) {
      console.error(`Failed to save to ${key}:`, error);
      this.handleStorageError(error);
      return false;
    }
  }

  /**
   * Sanitize data for storage by removing circular references and non-serializable values
   */
  private sanitizeForStorage(obj: any): any {
    const seen = new WeakSet();

    const sanitize = (value: any): any => {
      // Handle null and undefined
      if (value === null || value === undefined) {
        return value;
      }

      // Handle primitives
      if (typeof value !== 'object') {
        return value;
      }

      // Handle DOM elements and React components
      if (value instanceof Element || value instanceof Node) {
        return '[DOM Element]';
      }

      // Handle React Fiber nodes and other React internals
      if (
        value &&
        typeof value === 'object' &&
        (value.$$typeof ||
          value._reactInternalFiber ||
          value.__reactFiber ||
          typeof value.type === 'function' ||
          (value.constructor && value.constructor.name === 'FiberNode'))
      ) {
        return '[React Element]';
      }

      // Handle functions
      if (typeof value === 'function') {
        return '[Function]';
      }

      // Handle circular references
      if (seen.has(value)) {
        return '[Circular Reference]';
      }

      seen.add(value);

      // Handle arrays
      if (Array.isArray(value)) {
        return value.map(sanitize);
      }

      // Handle dates
      if (value instanceof Date) {
        return value.toISOString();
      }

      // Handle regular objects
      const sanitized: any = {};
      for (const key in value) {
        if (value.hasOwnProperty(key)) {
          try {
            sanitized[key] = sanitize(value[key]);
          } catch (error) {
            // Skip problematic properties
            console.warn(`Skipping problematic property ${key}:`, error);
            sanitized[key] = '[Unserializable]';
          }
        }
      }

      seen.delete(value);
      return sanitized;
    };

    return sanitize(obj);
  }

  /**
   * Check if an object has circular references
   */
  private hasCircularReference(obj: any): boolean {
    try {
      JSON.stringify(obj);
      return false;
    } catch (error) {
      return error instanceof TypeError && error.message.includes('circular');
    }
  }

  /**
   * Handle storage errors (quota exceeded, etc.)
   */
  private handleStorageError(error: any): void {
    if (error.name === 'QuotaExceededError') {
      console.warn('Storage quota exceeded, cleaning up old configurations...');
      this.cleanupOldConfigurations();
    }
  }

  /**
   * Clean up old configurations when storage is full
   */
  private cleanupOldConfigurations(): void {
    try {
      const allConfigs = Array.from(this.cache.values());

      // Sort by last used and success rate, keep the best ones
      const sorted = allConfigs.sort((a, b) => {
        const aScore =
          new Date(a.usage.lastUsed).getTime() + a.usage.successRate * 1000000;
        const bScore =
          new Date(b.usage.lastUsed).getTime() + b.usage.successRate * 1000000;
        return bScore - aScore;
      });

      // Keep only the top 50% of configurations
      const toKeep = sorted.slice(0, Math.ceil(sorted.length / 2));
      const toRemove = sorted.slice(Math.ceil(sorted.length / 2));

      // Update cache and storage
      toRemove.forEach(config => this.cache.delete(config.id));
      this.persistCache();

      console.log(`Cleaned up ${toRemove.length} old configurations`);
    } catch (error) {
      console.error('Failed to cleanup configurations:', error);
    }
  }

  /**
   * Persist cache to localStorage
   */
  private persistCache(): void {
    try {
      const configs = Array.from(this.cache.values());
      const globalConfigs = configs.filter(c => !c.repositoryId && !c.userId);
      const userConfigs = configs.filter(c => c.userId && !c.repositoryId);
      const repoConfigs = configs.filter(c => c.repositoryId);

      this.setStorageItem(STORAGE_KEYS.GLOBAL_CONFIG, globalConfigs);
      this.setStorageItem(STORAGE_KEYS.USER_CONFIGS, userConfigs);
      this.setStorageItem(STORAGE_KEYS.REPO_CONFIGS, repoConfigs);

      this.updateStorageMetadata({ totalConfigs: configs.length });
    } catch (error) {
      console.error('Failed to persist cache:', error);
    }
  }

  /**
   * Deep compare two configurations
   */
  public compareConfigurations(
    config1: DocumentationConfiguration,
    config2: DocumentationConfiguration
  ): ConfigComparisonResult {
    const differences: ConfigComparisonResult['differences'] = [];

    const compare = (obj1: any, obj2: any, path = ''): void => {
      for (const key in obj1) {
        const currentPath = path ? `${path}.${key}` : key;
        const val1 = obj1[key];
        const val2 = obj2[key];

        if (typeof val1 !== typeof val2) {
          differences.push({
            path: currentPath,
            oldValue: val1,
            newValue: val2,
            severity: this.getDifferenceSeverity(key, val1, val2),
          });
        } else if (Array.isArray(val1) && Array.isArray(val2)) {
          if (JSON.stringify(val1) !== JSON.stringify(val2)) {
            differences.push({
              path: currentPath,
              oldValue: val1,
              newValue: val2,
              severity: this.getDifferenceSeverity(key, val1, val2),
            });
          }
        } else if (typeof val1 === 'object' && val1 !== null && val2 !== null) {
          compare(val1, val2, currentPath);
        } else if (val1 !== val2) {
          differences.push({
            path: currentPath,
            oldValue: val1,
            newValue: val2,
            severity: this.getDifferenceSeverity(key, val1, val2),
          });
        }
      }

      // Check for new keys in obj2
      for (const key in obj2) {
        if (!(key in obj1)) {
          const currentPath = path ? `${path}.${key}` : key;
          differences.push({
            path: currentPath,
            oldValue: undefined,
            newValue: obj2[key],
            severity: this.getDifferenceSeverity(key, undefined, obj2[key]),
          });
        }
      }
    };

    compare(config1, config2);

    const totalFields = Object.keys(config1).length;
    const similarityScore = Math.max(
      0,
      100 - (differences.length / totalFields) * 100
    );

    return {
      areEqual: differences.length === 0,
      differences,
      similarityScore,
    };
  }

  /**
   * Determine the severity of a configuration difference
   */
  private getDifferenceSeverity(
    key: string,
    oldValue: any,
    newValue: any
  ): 'low' | 'medium' | 'high' {
    // High severity changes that significantly impact output
    const highSeverityKeys = [
      'aiModel',
      'temperature',
      'maxTokensPerFile',
      'style',
      'format',
      'includePatterns',
      'excludePatterns',
    ];

    // Medium severity changes that moderately impact output
    const mediumSeverityKeys = [
      'maxFileSize',
      'maxTotalFiles',
      'includeCodeExamples',
      'includeApiDocs',
      'structure',
    ];

    if (highSeverityKeys.includes(key)) return 'high';
    if (mediumSeverityKeys.includes(key)) return 'medium';
    return 'low';
  }

  /**
   * Extract pure configuration data, removing any React or DOM references
   */
  private extractPureConfig(
    config: DocumentationConfiguration
  ): DocumentationConfiguration {
    return {
      // File filtering
      includePatterns: Array.isArray(config.includePatterns)
        ? [...config.includePatterns]
        : [],
      excludePatterns: Array.isArray(config.excludePatterns)
        ? [...config.excludePatterns]
        : [],
      maxFileSize:
        typeof config.maxFileSize === 'number'
          ? config.maxFileSize
          : 1024 * 1024,
      maxTotalFiles:
        typeof config.maxTotalFiles === 'number' ? config.maxTotalFiles : 20,

      // Documentation style
      style: typeof config.style === 'string' ? config.style : 'comprehensive',
      includeCodeExamples: Boolean(config.includeCodeExamples),
      includeApiDocs: Boolean(config.includeApiDocs),
      includeArchitecture: Boolean(config.includeArchitecture),
      includeSetupInstructions: Boolean(config.includeSetupInstructions),
      includeTroubleshooting: Boolean(config.includeTroubleshooting),

      // Output configuration
      format: typeof config.format === 'string' ? config.format : 'markdown',
      structure:
        typeof config.structure === 'string' ? config.structure : 'single-file',
      includeTableOfContents: Boolean(config.includeTableOfContents),
      includeBadges: Boolean(config.includeBadges),
      includeContributingGuide: Boolean(config.includeContributingGuide),

      // Advanced options
      aiModel:
        typeof config.aiModel === 'string' ? config.aiModel : 'gpt-3.5-turbo',
      temperature:
        typeof config.temperature === 'number' ? config.temperature : 0.3,
      maxTokensPerFile:
        typeof config.maxTokensPerFile === 'number'
          ? config.maxTokensPerFile
          : 6000,
      includePrivateFiles: Boolean(config.includePrivateFiles),
      generateDiagrams: Boolean(config.generateDiagrams),
      customPrompt:
        typeof config.customPrompt === 'string' ? config.customPrompt : '',

      // Processing options
      batchSize: typeof config.batchSize === 'number' ? config.batchSize : 10,
      concurrency:
        typeof config.concurrency === 'number' ? config.concurrency : 3,
      timeout: typeof config.timeout === 'number' ? config.timeout : 300000,

      // Webhook / Sync options
      enableAutoSync: Boolean(config.enableAutoSync),
    };
  }

  /**
   * Save configuration with smart updates
   */
  public saveConfiguration(
    config: DocumentationConfiguration,
    options: {
      name?: string;
      repository?: GitHubRepository;
      userId?: string;
      tags?: string[];
      forceNew?: boolean;
    } = {}
  ): {
    success: boolean;
    configId: string;
    wasUpdated: boolean;
    savedConfig: SavedConfiguration;
  } {
    try {
      const {
        name = 'Untitled Configuration',
        repository,
        userId,
        tags = [],
        forceNew = false,
      } = options;

      // Extract pure configuration data to avoid circular references
      const pureConfig = this.extractPureConfig(config);

      // Debug log to ensure we have clean data
      console.log('Saving pure config:', {
        configKeys: Object.keys(pureConfig),
        hasCircularRef: this.hasCircularReference(pureConfig),
      });

      // Find existing similar configuration
      let existingConfig: SavedConfiguration | null = null;

      if (!forceNew) {
        existingConfig = this.findSimilarConfiguration(
          pureConfig,
          repository,
          userId
        );
      }

      let savedConfig: SavedConfiguration;
      let wasUpdated = false;

      if (existingConfig && !forceNew) {
        // Update existing configuration
        const comparison = this.compareConfigurations(
          existingConfig,
          pureConfig
        );

        if (!comparison.areEqual) {
          savedConfig = {
            ...existingConfig,
            ...pureConfig,
            updatedAt: new Date().toISOString(),
            usage: {
              ...existingConfig.usage,
              timesUsed: existingConfig.usage.timesUsed + 1,
              lastUsed: new Date().toISOString(),
            },
          };
          wasUpdated = true;
        } else {
          // Just update usage stats
          savedConfig = {
            ...existingConfig,
            usage: {
              ...existingConfig.usage,
              timesUsed: existingConfig.usage.timesUsed + 1,
              lastUsed: new Date().toISOString(),
            },
          };
        }
      } else {
        // Create new configuration
        const now = new Date().toISOString();
        savedConfig = {
          ...pureConfig,
          id: this.generateConfigId(pureConfig, repository),
          name,
          createdAt: now,
          updatedAt: now,
          repositoryId: repository?.id.toString(),
          repositoryName: repository?.full_name,
          userId,
          tags,
          usage: {
            timesUsed: 1,
            lastUsed: now,
            successRate: 1.0,
          },
        };
      }

      // Save to cache and storage
      this.cache.set(savedConfig.id, savedConfig);
      this.persistCache();

      // Update recent configurations
      this.updateRecentConfigurations(savedConfig);

      return {
        success: true,
        configId: savedConfig.id,
        wasUpdated,
        savedConfig,
      };
    } catch (error) {
      console.error('Failed to save configuration:', error);
      return {
        success: false,
        configId: '',
        wasUpdated: false,
        savedConfig: {} as SavedConfiguration,
      };
    }
  }

  /**
   * Find similar existing configuration
   */
  private findSimilarConfiguration(
    config: DocumentationConfiguration,
    repository?: GitHubRepository,
    userId?: string
  ): SavedConfiguration | null {
    const candidates = Array.from(this.cache.values()).filter(saved => {
      // Match by repository if provided
      if (repository && saved.repositoryId) {
        return saved.repositoryId === repository.id.toString();
      }

      // Match by user if provided
      if (userId && saved.userId) {
        return saved.userId === userId;
      }

      // Global configurations
      return !saved.repositoryId && !saved.userId;
    });

    // Find the most similar configuration
    let bestMatch: SavedConfiguration | null = null;
    let bestScore = 0;

    for (const candidate of candidates) {
      const comparison = this.compareConfigurations(candidate, config);
      if (
        comparison.similarityScore > bestScore &&
        comparison.similarityScore >= 80
      ) {
        bestScore = comparison.similarityScore;
        bestMatch = candidate;
      }
    }

    return bestMatch;
  }

  /**
   * Generate unique configuration ID
   */
  private generateConfigId(
    config: DocumentationConfiguration,
    repository?: GitHubRepository
  ): string {
    const timestamp = Date.now();
    const repoId = repository?.id || 'global';
    const styleHash = this.hashString(
      config.style + config.format + config.aiModel
    );
    return `config_${repoId}_${styleHash}_${timestamp}`;
  }

  /**
   * Simple string hash function
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Update recent configurations list
   */
  private updateRecentConfigurations(config: SavedConfiguration): void {
    try {
      const recent =
        this.getStorageItem<SavedConfiguration[]>(
          STORAGE_KEYS.RECENT_CONFIGS
        ) || [];

      // Remove if already exists
      const filtered = recent.filter(r => r.id !== config.id);

      // Add to beginning
      filtered.unshift(config);

      // Keep only last 10
      const trimmed = filtered.slice(0, 10);

      this.setStorageItem(STORAGE_KEYS.RECENT_CONFIGS, trimmed);
    } catch (error) {
      console.error('Failed to update recent configurations:', error);
    }
  }

  /**
   * Load configuration by ID
   */
  public loadConfiguration(configId: string): SavedConfiguration | null {
    return this.cache.get(configId) || null;
  }

  /**
   * Get configurations for repository
   */
  public getRepositoryConfigurations(
    repository: GitHubRepository
  ): SavedConfiguration[] {
    return Array.from(this.cache.values())
      .filter(config => config.repositoryId === repository.id.toString())
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
  }

  /**
   * Get global configurations
   */
  public getGlobalConfigurations(): SavedConfiguration[] {
    return Array.from(this.cache.values())
      .filter(config => !config.repositoryId && !config.userId)
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
  }

  /**
   * Get recent configurations
   */
  public getRecentConfigurations(): SavedConfiguration[] {
    return (
      this.getStorageItem<SavedConfiguration[]>(STORAGE_KEYS.RECENT_CONFIGS) ||
      []
    );
  }

  /**
   * Delete configuration
   */
  public deleteConfiguration(configId: string): boolean {
    try {
      if (this.cache.has(configId)) {
        this.cache.delete(configId);
        this.persistCache();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to delete configuration:', error);
      return false;
    }
  }

  /**
   * Update configuration success rate
   */
  public updateConfigurationSuccess(configId: string, success: boolean): void {
    try {
      const config = this.cache.get(configId);
      if (config) {
        const currentRate = config.usage.successRate;
        const timesUsed = config.usage.timesUsed;

        // Calculate new success rate using weighted average
        const newRate =
          (currentRate * (timesUsed - 1) + (success ? 1 : 0)) / timesUsed;

        config.usage.successRate = Math.max(0, Math.min(1, newRate));
        this.cache.set(configId, config);
        this.persistCache();
      }
    } catch (error) {
      console.error('Failed to update configuration success rate:', error);
    }
  }

  /**
   * Get storage statistics
   */
  public getStorageStats(): {
    totalConfigurations: number;
    storageUsed: number;
    storageAvailable: number;
    mostUsedConfig: SavedConfiguration | null;
    recentActivity: number;
  } {
    try {
      const configs = Array.from(this.cache.values());

      const storageUsed = JSON.stringify(configs).length;
      const storageAvailable = 5 * 1024 * 1024 - storageUsed; // Assume 5MB limit

      const mostUsed = configs.reduce((prev, current) =>
        current.usage.timesUsed > prev.usage.timesUsed ? current : prev
      );

      const recent = configs.filter(
        c =>
          new Date(c.usage.lastUsed).getTime() >
          Date.now() - 7 * 24 * 60 * 60 * 1000
      ).length;

      return {
        totalConfigurations: configs.length,
        storageUsed,
        storageAvailable,
        mostUsedConfig: mostUsed || null,
        recentActivity: recent,
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return {
        totalConfigurations: 0,
        storageUsed: 0,
        storageAvailable: 0,
        mostUsedConfig: null,
        recentActivity: 0,
      };
    }
  }
}

// Create singleton instance
export const configManager = new GitHubConfigurationManager();

// Export utility functions
export function saveGitHubConfig(
  config: DocumentationConfiguration,
  options?: {
    name?: string;
    repository?: GitHubRepository;
    userId?: string;
    tags?: string[];
    forceNew?: boolean;
  }
) {
  return configManager.saveConfiguration(config, options);
}

export function getRepositoryConfigs(repository: GitHubRepository) {
  return configManager.getRepositoryConfigurations(repository);
}

export function getRecentConfigs() {
  return configManager.getRecentConfigurations();
}

export function compareConfigs(
  config1: DocumentationConfiguration,
  config2: DocumentationConfiguration
) {
  return configManager.compareConfigurations(config1, config2);
}

export function updateConfigSuccess(configId: string, success: boolean) {
  return configManager.updateConfigurationSuccess(configId, success);
}

// Export types
export type { SavedConfiguration, ConfigComparisonResult, StorageMetadata };
