import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { z } from 'zod';
import { logger } from './logger';
import {
  handleNetworkError,
  ExternalServiceError,
  ValidationError,
  RateLimitError,
  AuthenticationError,
} from './errors';
import { github as githubConfig, processing } from './config';
import type {
  GitHubUser,
  GitHubRepository,
  GitHubContent,
  GitHubTree,
  GitHubLanguages,
  GitHubBranch,
  GitHubRateLimit,
  GitHubError,
  RepositoryStructure,
  DirectoryNode,
  FileNode,
} from '../types/github';

interface RateLimitBucket {
  tokens: number;
  lastRefill: number;
  maxTokens: number;
  refillRate: number; // tokens per second
}

class RateLimiter {
  private buckets = new Map<string, RateLimitBucket>();

  constructor(
    private maxTokens: number = 5000,
    private refillRate: number = 1.39 // GitHub's rate: 5000 requests per hour
  ) {}

  async waitForToken(key: string = 'default'): Promise<void> {
    const bucket = this.getBucket(key);

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return;
    }

    const timeToWait = Math.ceil(1000 / this.refillRate);
    await new Promise(resolve => setTimeout(resolve, timeToWait));

    this.refillBucket(bucket);
    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return;
    }

    throw new RateLimitError('GitHub API rate limit exceeded');
  }

  private getBucket(key: string): RateLimitBucket {
    if (!this.buckets.has(key)) {
      this.buckets.set(key, {
        tokens: this.maxTokens,
        lastRefill: Date.now(),
        maxTokens: this.maxTokens,
        refillRate: this.refillRate,
      });
    }

    const bucket = this.buckets.get(key)!;
    this.refillBucket(bucket);
    return bucket;
  }

  private refillBucket(bucket: RateLimitBucket): void {
    const now = Date.now();
    const timePassed = (now - bucket.lastRefill) / 1000;
    const tokensToAdd = Math.floor(timePassed * bucket.refillRate);

    if (tokensToAdd > 0) {
      bucket.tokens = Math.min(bucket.maxTokens, bucket.tokens + tokensToAdd);
      bucket.lastRefill = now;
    }
  }

  updateFromHeaders(
    headers: Record<string, string>,
    key: string = 'default'
  ): void {
    const remaining = parseInt(headers['x-ratelimit-remaining'] || '0');
    const limit = parseInt(headers['x-ratelimit-limit'] || '5000');
    const reset = parseInt(headers['x-ratelimit-reset'] || '0');

    const bucket = this.getBucket(key);
    bucket.tokens = remaining;
    bucket.maxTokens = limit;

    const resetTime = reset * 1000;
    const timeUntilReset = Math.max(0, resetTime - Date.now());
    if (timeUntilReset > 0) {
      bucket.refillRate = remaining / (timeUntilReset / 1000);
    }
  }
}

export class GitHubClient {
  private client: AxiosInstance;
  private rateLimiter: RateLimiter;
  private token: string | null = null;

  constructor() {
    this.rateLimiter = new RateLimiter(
      githubConfig.rateLimit.max,
      githubConfig.rateLimit.max / (githubConfig.rateLimit.windowMs / 1000)
    );

    this.client = axios.create({
      baseURL: githubConfig.baseUrl,
      timeout: 30000,
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'DocScrive/1.0.0',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.client.interceptors.request.use(
      async config => {
        await this.rateLimiter.waitForToken();

        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }

        logger.info('GitHub API request', {
          method: config.method?.toUpperCase(),
          url: config.url,
          hasAuth: !!this.token,
        });

        return config;
      },
      error => {
        logger.error('GitHub request interceptor error', {
          error: error.message,
        });
        return Promise.reject(handleNetworkError(error));
      }
    );

    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        this.rateLimiter.updateFromHeaders(
          response.headers as Record<string, string>
        );

        logger.info('GitHub API response', {
          status: response.status,
          rateLimit: {
            remaining: response.headers['x-ratelimit-remaining'],
            limit: response.headers['x-ratelimit-limit'],
            reset: response.headers['x-ratelimit-reset'],
          },
        });

        return response;
      },
      error => {
        if (error.response?.status === 401) {
          logger.error('GitHub authentication failed', {
            status: error.response.status,
            message: error.response.data?.message,
          });
          throw new AuthenticationError('GitHub authentication failed');
        }

        if (error.response?.status === 403) {
          const rateLimitRemaining =
            error.response.headers['x-ratelimit-remaining'];
          if (rateLimitRemaining === '0') {
            const resetTime =
              parseInt(error.response.headers['x-ratelimit-reset']) * 1000;
            const waitTime = Math.max(0, resetTime - Date.now());
            throw new RateLimitError(
              `GitHub API rate limit exceeded. Resets in ${Math.ceil(waitTime / 1000)}s`
            );
          }
        }

        logger.error('GitHub API error', {
          status: error.response?.status,
          message: error.response?.data?.message,
          url: error.config?.url,
        });

        return Promise.reject(handleNetworkError(error));
      }
    );
  }

  setToken(token: string): void {
    this.token = token;
    logger.info('GitHub token set for client');
  }

  clearToken(): void {
    this.token = null;
    logger.info('GitHub token cleared from client');
  }

  async getCurrentUser(): Promise<GitHubUser> {
    if (!this.token) {
      throw new AuthenticationError('GitHub token required');
    }

    try {
      const response = await this.client.get<GitHubUser>('/user');
      return response.data;
    } catch (error) {
      throw new ExternalServiceError('GitHub', 'Failed to fetch current user');
    }
  }

  async getRepositories(
    options: {
      type?: 'all' | 'owner' | 'public' | 'private' | 'member';
      sort?: 'created' | 'updated' | 'pushed' | 'full_name';
      direction?: 'asc' | 'desc';
      per_page?: number;
      page?: number;
    } = {}
  ): Promise<GitHubRepository[]> {
    if (!this.token) {
      throw new AuthenticationError('GitHub token required');
    }

    try {
      const params = {
        type: options.type || 'all',
        sort: options.sort || 'updated',
        direction: options.direction || 'desc',
        per_page: Math.min(options.per_page || 100, 100),
        page: options.page || 1,
      };

      const response = await this.client.get<GitHubRepository[]>(
        '/user/repos',
        { params }
      );
      return response.data;
    } catch (error) {
      throw new ExternalServiceError('GitHub', 'Failed to fetch repositories');
    }
  }

  async getRepository(owner: string, repo: string): Promise<GitHubRepository> {
    try {
      const response = await this.client.get<GitHubRepository>(
        `/repos/${owner}/${repo}`
      );
      return response.data;
    } catch (error) {
      throw new ExternalServiceError(
        'GitHub',
        `Failed to fetch repository ${owner}/${repo}`
      );
    }
  }

  async getRepositoryLanguages(
    owner: string,
    repo: string
  ): Promise<GitHubLanguages> {
    try {
      const response = await this.client.get<GitHubLanguages>(
        `/repos/${owner}/${repo}/languages`
      );
      return response.data;
    } catch (error) {
      throw new ExternalServiceError(
        'GitHub',
        `Failed to fetch languages for ${owner}/${repo}`
      );
    }
  }

  async getBranches(owner: string, repo: string): Promise<GitHubBranch[]> {
    try {
      const response = await this.client.get<GitHubBranch[]>(
        `/repos/${owner}/${repo}/branches`
      );
      return response.data;
    } catch (error) {
      throw new ExternalServiceError(
        'GitHub',
        `Failed to fetch branches for ${owner}/${repo}`
      );
    }
  }

  // Content methods
  async getRepositoryTree(
    owner: string,
    repo: string,
    sha: string = 'HEAD',
    recursive: boolean = true
  ): Promise<GitHubTree> {
    try {
      const params = recursive ? { recursive: '1' } : {};
      const response = await this.client.get<GitHubTree>(
        `/repos/${owner}/${repo}/git/trees/${sha}`,
        { params }
      );
      return response.data;
    } catch (error) {
      throw new ExternalServiceError(
        'GitHub',
        `Failed to fetch repository tree for ${owner}/${repo}`
      );
    }
  }

  async getFileContent(
    owner: string,
    repo: string,
    path: string,
    ref?: string
  ): Promise<GitHubContent> {
    try {
      const params = ref ? { ref } : {};
      const response = await this.client.get<GitHubContent>(
        `/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`,
        { params }
      );
      return response.data;
    } catch (error) {
      throw new ExternalServiceError(
        'GitHub',
        `Failed to fetch file content: ${path}`
      );
    }
  }

  async getMultipleFiles(
    owner: string,
    repo: string,
    paths: string[],
    ref?: string,
    batchSize: number = 10
  ): Promise<GitHubContent[]> {
    const results: GitHubContent[] = [];

    // Process files in batches to avoid overwhelming the API
    for (let i = 0; i < paths.length; i += batchSize) {
      const batch = paths.slice(i, i + batchSize);
      const batchPromises = batch.map(path =>
        this.getFileContent(owner, repo, path, ref).catch(error => {
          logger.warn(`Failed to fetch file: ${path}`, {
            error: error.message,
          });
          return null;
        })
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(
        ...batchResults.filter(
          (result): result is GitHubContent => result !== null
        )
      );

      // Add a small delay between batches to be respectful
      if (i + batchSize < paths.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return results;
  }

  // Repository analysis methods
  async analyzeRepositoryStructure(
    owner: string,
    repo: string,
    branch: string = 'HEAD'
  ): Promise<RepositoryStructure> {
    try {
      const tree = await this.getRepositoryTree(owner, repo, branch, true);

      if (tree.tree.length > processing.maxFilesPerRepo) {
        throw new ValidationError(
          `Repository has too many files (${tree.tree.length}). Maximum allowed: ${processing.maxFilesPerRepo}`
        );
      }

      const structure = this.buildRepositoryStructure(tree);

      logger.info('Repository structure analyzed', {
        owner,
        repo,
        totalFiles: structure.flatFiles.length,
        totalSize: structure.totalSize,
        depth: structure.depth,
      });

      return structure;
    } catch (error) {
      throw new ExternalServiceError(
        'GitHub',
        `Failed to analyze repository structure for ${owner}/${repo}`
      );
    }
  }

  private buildRepositoryStructure(tree: GitHubTree): RepositoryStructure {
    const pathMap = new Map<string, DirectoryNode | FileNode>();
    const flatFiles: FileNode[] = [];
    let totalSize = 0;
    let maxDepth = 0;

    // Create root directory
    const root: DirectoryNode = {
      name: '',
      path: '',
      type: 'directory',
      children: [],
      size: 0,
    };
    pathMap.set('', root);

    // Sort tree items by path to ensure parent directories are processed first
    const sortedItems = tree.tree.sort((a, b) => a.path.localeCompare(b.path));

    for (const item of sortedItems) {
      const pathParts = item.path.split('/');
      const depth = pathParts.length;
      maxDepth = Math.max(maxDepth, depth);

      if (item.type === 'blob') {
        // Create file node
        const extension = item.path.includes('.')
          ? item.path.split('.').pop()?.toLowerCase() || ''
          : '';

        const fileNode: FileNode = {
          name: pathParts[pathParts.length - 1],
          path: item.path,
          type: 'file',
          extension,
          size: item.size || 0,
          sha: item.sha,
          isDocumentable: this.isDocumentableFile(item.path, extension),
          skipReason: this.getSkipReason(item.path, extension, item.size || 0),
        };

        flatFiles.push(fileNode);
        pathMap.set(item.path, fileNode);
        totalSize += item.size || 0;

        // Add to parent directory
        const parentPath = pathParts.slice(0, -1).join('/');
        const parent = pathMap.get(parentPath) as DirectoryNode;
        if (parent && parent.type === 'directory') {
          parent.children.push(fileNode);
          parent.size += item.size || 0;
        }
      } else if (item.type === 'tree') {
        // Create directory node if it doesn't exist
        if (!pathMap.has(item.path)) {
          const dirNode: DirectoryNode = {
            name: pathParts[pathParts.length - 1],
            path: item.path,
            type: 'directory',
            children: [],
            size: 0,
          };

          pathMap.set(item.path, dirNode);

          // Add to parent directory
          const parentPath = pathParts.slice(0, -1).join('/');
          const parent = pathMap.get(parentPath) as DirectoryNode;
          if (parent && parent.type === 'directory') {
            parent.children.push(dirNode);
          }
        }
      }
    }

    return {
      root,
      flatFiles,
      totalSize,
      depth: maxDepth,
    };
  }

  private isDocumentableFile(path: string, extension: string): boolean {
    // Skip common non-documentable files
    const skipExtensions = new Set([
      'jpg',
      'jpeg',
      'png',
      'gif',
      'svg',
      'ico',
      'bmp',
      'webp',
      'mp3',
      'mp4',
      'avi',
      'mov',
      'wmv',
      'flv',
      'zip',
      'tar',
      'gz',
      'rar',
      '7z',
      'exe',
      'dll',
      'so',
      'dylib',
      'bin',
      'dat',
      'db',
      'sqlite',
      'lock',
      'log',
      'tmp',
      'cache',
    ]);

    const skipPaths = [
      'node_modules/',
      '.git/',
      'dist/',
      'build/',
      'coverage/',
      '.next/',
      'target/',
      'vendor/',
    ];

    // Check if path should be skipped
    if (skipPaths.some(skipPath => path.includes(skipPath))) {
      return false;
    }

    // Check if extension should be skipped
    if (skipExtensions.has(extension)) {
      return false;
    }

    return true;
  }

  private getSkipReason(
    path: string,
    extension: string,
    size: number
  ): string | undefined {
    if (path.includes('node_modules/')) return 'node_modules directory';
    if (path.includes('.git/')) return 'git directory';
    if (path.includes('dist/') || path.includes('build/'))
      return 'build directory';
    if (size > 1024 * 1024) return 'file too large (>1MB)';
    if (!this.isDocumentableFile(path, extension))
      return 'non-documentable file type';
    return undefined;
  }

  // Utility methods
  async getRateLimit(): Promise<GitHubRateLimit> {
    try {
      const response = await this.client.get<{ rate: GitHubRateLimit }>(
        '/rate_limit'
      );
      return response.data.rate;
    } catch (error) {
      throw new ExternalServiceError(
        'GitHub',
        'Failed to fetch rate limit info'
      );
    }
  }

  async searchRepositories(
    query: string,
    options: {
      sort?: 'stars' | 'forks' | 'help-wanted-issues' | 'updated';
      order?: 'desc' | 'asc';
      per_page?: number;
      page?: number;
    } = {}
  ): Promise<{ items: GitHubRepository[]; total_count: number }> {
    try {
      const params = {
        q: query,
        sort: options.sort || 'stars',
        order: options.order || 'desc',
        per_page: Math.min(options.per_page || 30, 100),
        page: options.page || 1,
      };

      const response = await this.client.get('/search/repositories', {
        params,
      });
      return response.data;
    } catch (error) {
      throw new ExternalServiceError('GitHub', 'Failed to search repositories');
    }
  }
}

export const githubClient = new GitHubClient();
