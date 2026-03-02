import { Octokit } from '@octokit/rest';
import { minimatch } from 'minimatch';
import pLimit from 'p-limit';

interface GitHubConfig {
  token?: string;
  maxConcurrentRequests: number;
  maxFileSize: number;
  maxTotalFiles: number;
  requestTimeout: number;
  retryAttempts: number;
  retryDelay: number;
}

interface FileContent {
  path: string;
  content: string;
  size: number;
  language?: string;
  sha: string;
}

interface RepositoryContent {
  files: FileContent[];
  totalSize: number;
  skippedFiles: Array<{
    path: string;
    reason: string;
  }>;
  metadata: {
    repository: string;
    branch: string;
    fetchedAt: string;
    totalFiles: number;
    processedFiles: number;
  };
}

interface DocumentationConfig {
  includePatterns: string[];
  excludePatterns: string[];
  maxFileSize: number;
  maxTotalFiles: number;
  includePrivateFiles?: boolean;
}

class GitHubRepositoryFetcher {
  private octokit: Octokit;
  private config: GitHubConfig;
  private logger: Console | any;

  constructor(config: GitHubConfig, logger: Console | any) {
    this.config = { ...config };
    this.octokit = new Octokit({
      auth: config.token,
      request: {
        timeout: this.config.requestTimeout,
      },
    });
    this.logger = logger;
  }

  async fetchRepositoryContent(
    githubUrl: string,
    docConfig: DocumentationConfig,
    branch: string = 'main'
  ): Promise<RepositoryContent> {
    try {
      this.logger.info('Starting repository content fetch', {
        githubUrl,
        branch,
      });

      const { owner, repo } = this.parseRepositoryUrl(githubUrl);
      await this.validateRepositoryAccess(owner, repo);

      // Get the actual default branch if "main" doesn't exist
      const actualBranch = await this.getDefaultBranch(owner, repo, branch);
      const tree = await this.getRepositoryTree(owner, repo, actualBranch);
      const filteredFiles = this.filterFiles(tree, docConfig);
      const fileContents = await this.fetchFileContents(
        owner,
        repo,
        filteredFiles,
        docConfig,
        actualBranch
      );

      const result: RepositoryContent = {
        files: fileContents.files,
        totalSize: fileContents.totalSize,
        skippedFiles: fileContents.skippedFiles,
        metadata: {
          repository: `${owner}/${repo}`,
          branch: actualBranch,
          fetchedAt: new Date().toISOString(),
          totalFiles: tree.length,
          processedFiles: fileContents.files.length,
        },
      };

      this.logger.info('Repository content fetch completed', {
        repository: `${owner}/${repo}`,
        totalFiles: result.metadata.totalFiles,
        processedFiles: result.metadata.processedFiles,
        totalSize: result.totalSize,
        skippedFiles: result.skippedFiles.length,
      });

      return result;
    } catch (error: any) {
      this.logger.error('Failed to fetch repository content', {
        githubUrl,
        error: error.message,
        stack: error.stack,
      });
      throw new Error(`Failed to fetch repository content: ${error.message}`);
    }
  }

  private parseRepositoryUrl(githubUrl: string): {
    owner: string;
    repo: string;
  } {
    try {
      const url = new URL(githubUrl);
      let pathParts: string[];

      this.logger.info('Parsing GitHub URL:', { url: url.toString() });

      if (url.hostname === 'github.com') {
        // Remove leading slash, remove .git suffix, then split
        const cleanPath = url.pathname
          .replace(/^\//, '')
          .replace(/\.git$/, '')
          .replace(/\/$/, ''); // Also remove trailing slash

        pathParts = cleanPath.split('/');
      } else if (url.hostname === 'raw.githubusercontent.com') {
        pathParts = url.pathname.replace(/^\//, '').split('/');
      } else {
        throw new Error('Unsupported GitHub URL format');
      }

      // Validate we have at least owner and repo
      if (pathParts.length < 2 || !pathParts[0] || !pathParts[1]) {
        throw new Error(
          'Invalid GitHub repository URL - missing owner or repository name'
        );
      }

      return {
        owner: pathParts[0],
        repo: pathParts[1],
      };
    } catch (error: any) {
      this.logger.error('Error parsing GitHub URL:', error);
      throw new Error(`Invalid GitHub URL format: ${error.message}`);
    }
  }

  private async validateRepositoryAccess(
    owner: string,
    repo: string
  ): Promise<void> {
    try {
      await this.octokit.repos.get({ owner, repo });
    } catch (error: any) {
      if (error.status === 404) {
        throw new Error('Repository not found or access denied');
      } else if (error.status === 403) {
        throw new Error('Rate limit exceeded or insufficient permissions');
      }
      throw new Error(`Failed to access repository: ${error.message}`);
    }
  }

  private async getDefaultBranch(
    owner: string,
    repo: string,
    preferredBranch: string
  ): Promise<string> {
    try {
      // First try the preferred branch
      await this.octokit.git.getRef({
        owner,
        repo,
        ref: `heads/${preferredBranch}`,
      });
      return preferredBranch;
    } catch (error: any) {
      if (error.status === 404) {
        // Try to get the repository's default branch
        try {
          const { data: repoData } = await this.octokit.repos.get({
            owner,
            repo,
          });
          this.logger.info(`Using default branch: ${repoData.default_branch}`);
          return repoData.default_branch;
        } catch (repoError: any) {
          // Fallback to master if main doesn't exist
          if (preferredBranch === 'main') {
            this.logger.info('Branch "main" not found, trying "master"');
            return 'master';
          }
          throw error;
        }
      }
      throw error;
    }
  }

  private async getRepositoryTree(
    owner: string,
    repo: string,
    branch: string
  ): Promise<
    Array<{ path: string; type: string; size?: number; sha: string }>
  > {
    try {
      const { data: ref } = await this.octokit.git.getRef({
        owner,
        repo,
        ref: `heads/${branch}`,
      });

      const { data: tree } = await this.octokit.git.getTree({
        owner,
        repo,
        tree_sha: ref.object.sha,
        recursive: 'true',
      });

      return tree.tree
        .filter(item => item.type === 'blob')
        .map(item => ({
          path: item.path!,
          type: item.type!,
          size: item.size,
          sha: item.sha!,
        }));
    } catch (error: any) {
      throw new Error(`Failed to get repository tree: ${error.message}`);
    }
  }

  private filterFiles(
    files: Array<{ path: string; type: string; size?: number; sha: string }>,
    config: DocumentationConfig
  ): Array<{ path: string; size?: number; sha: string }> {
    return files
      .filter(file => {
        // Skip binary files and large files early
        if (this.isBinaryFile(file.path)) {
          return false;
        }

        // Check for private/sensitive files if includePrivateFiles is false
        if (!config.includePrivateFiles && this.isPrivateFile(file.path)) {
          return false;
        }

        // Check exclude patterns
        for (const pattern of config.excludePatterns) {
          if (minimatch(file.path, pattern)) {
            return false;
          }
        }

        // Check include patterns
        if (config.includePatterns.length === 0) {
          return true;
        }

        for (const pattern of config.includePatterns) {
          if (minimatch(file.path, pattern)) {
            return true;
          }
        }

        return false;
      })
      .filter(file => {
        if (file.size && file.size > config.maxFileSize) {
          return false;
        }
        return true;
      })
      .slice(0, config.maxTotalFiles);
  }

  private isPrivateFile(filePath: string): boolean {
    const privatePatterns = [
      // Configuration files with potential secrets
      '**/.env*',
      '**/secrets*',
      '**/config/production*',
      '**/config/staging*',
      '**/*.key',
      '**/*.pem',
      '**/*.p12',
      '**/*.pfx',
      '**/*.keystore',
      '**/*.jks',
      // SSH and security files
      '**/.ssh/**',
      '**/id_rsa*',
      '**/id_dsa*',
      '**/id_ecdsa*',
      '**/id_ed25519*',
      // Private directories
      '**/private/**',
      '**/confidential/**',
      '**/internal/**',
      // Database files
      '**/*.db',
      '**/*.sqlite*',
      '**/*.sql',
      // Backup and temporary files
      '**/*.bak',
      '**/*.backup',
      '**/*.swp',
      '**/*~',
      // IDE private settings
      '**/.vscode/settings.json',
      '**/.idea/**',
    ];

    return privatePatterns.some(pattern => minimatch(filePath, pattern));
  }

  private isBinaryFile(filePath: string): boolean {
    const binaryExtensions = [
      '.png',
      '.jpg',
      '.jpeg',
      '.gif',
      '.bmp',
      '.ico',
      '.svg',
      '.pdf',
      '.zip',
      '.tar',
      '.gz',
      '.rar',
      '.7z',
      '.exe',
      '.dll',
      '.so',
      '.dylib',
      '.mp3',
      '.mp4',
      '.avi',
      '.mov',
      '.woff',
      '.woff2',
      '.ttf',
      '.eot',
      '.class',
      '.jar',
      '.war',
      '.o',
      '.obj',
      '.lib',
      '.a',
    ];

    const extension = filePath.toLowerCase().split('.').pop();
    return extension ? binaryExtensions.includes(`.${extension}`) : false;
  }

  private async fetchFileContents(
    owner: string,
    repo: string,
    files: Array<{ path: string; size?: number; sha: string }>,
    config: DocumentationConfig,
    branch: string
  ): Promise<{
    files: FileContent[];
    totalSize: number;
    skippedFiles: Array<{ path: string; reason: string }>;
  }> {
    // Reduce concurrent requests to avoid rate limiting
    const limit = pLimit(Math.min(this.config.maxConcurrentRequests, 3));
    const results: FileContent[] = [];
    const skippedFiles: Array<{ path: string; reason: string }> = [];
    let totalSize = 0;

    const fetchPromises = files.map(file =>
      limit(async () => {
        try {
          const content = await this.fetchSingleFile(
            owner,
            repo,
            file.path,
            branch // Use branch instead of sha
          );
          if (content) {
            results.push(content);
            totalSize += content.size;
          } else {
            skippedFiles.push({
              path: file.path,
              reason: 'Failed to fetch content',
            });
          }
        } catch (error: any) {
          this.logger.warn('Failed to fetch file', {
            path: file.path,
            error: error.message,
          });
          skippedFiles.push({
            path: file.path,
            reason: error.message,
          });
        }
      })
    );

    await Promise.all(fetchPromises);
    return { files: results, totalSize, skippedFiles };
  }

  private async fetchSingleFile(
    owner: string,
    repo: string,
    path: string,
    branch: string // Changed from sha to branch
  ): Promise<FileContent | null> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const { data } = await this.octokit.repos.getContent({
          owner,
          repo,
          path,
          ref: branch, // Use branch instead of sha
        });

        if (Array.isArray(data)) {
          // This is a directory, skip it
          return null;
        }

        if ('content' in data && data.content) {
          // Check if it's a binary file by trying to decode
          try {
            const content = Buffer.from(data.content, 'base64').toString(
              'utf-8'
            );

            // Basic check for binary content
            if (this.containsBinaryData(content)) {
              return null;
            }

            return {
              path,
              content,
              size: data.size!,
              language: this.detectLanguage(path),
              sha: data.sha!,
            };
          } catch (decodeError) {
            // Failed to decode as UTF-8, likely binary
            return null;
          }
        }

        return null;
      } catch (error: any) {
        lastError = error;

        // Don't retry on 404 (file not found) or 403 (access denied)
        if (error.status === 404 || error.status === 403) {
          throw error;
        }

        if (attempt < this.config.retryAttempts) {
          await this.delay(this.config.retryDelay * attempt);
        }
      }
    }

    throw lastError!;
  }

  private containsBinaryData(content: string): boolean {
    // Check for null bytes or high percentage of non-printable characters
    if (content.includes('\0')) {
      return true;
    }

    const nonPrintableCount = content.split('').filter(char => {
      const code = char.charCodeAt(0);
      return code < 32 && code !== 9 && code !== 10 && code !== 13; // Allow tab, newline, carriage return
    }).length;

    return nonPrintableCount / content.length > 0.1; // More than 10% non-printable
  }

  private detectLanguage(filePath: string): string | undefined {
    const extension = filePath.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      js: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      py: 'python',
      java: 'java',
      go: 'go',
      rs: 'rust',
      cpp: 'cpp',
      c: 'c',
      h: 'c',
      php: 'php',
      rb: 'ruby',
      swift: 'swift',
      kt: 'kotlin',
      cs: 'csharp',
      md: 'markdown',
      json: 'json',
      yaml: 'yaml',
      yml: 'yaml',
      xml: 'xml',
      html: 'html',
      css: 'css',
      scss: 'scss',
      sql: 'sql',
    };

    return extension ? languageMap[extension] : undefined;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export async function fetchCodeFromGitHubUrl(
  githubUrl: string,
  config: DocumentationConfig,
  githubToken?: string,
  logger?: any
): Promise<RepositoryContent> {
  if (!githubUrl) {
    throw new Error('GitHub URL is required');
  }

  if (!validateGitHubUrl(githubUrl)) {
    throw new Error('Invalid GitHub URL format');
  }

  // Try using GitHub API with token first if available
  if (githubToken) {
    try {
      const fetcher = new GitHubRepositoryFetcher(
        {
          token: githubToken,
          maxConcurrentRequests: 3, // Reduced from 5 to avoid rate limiting
          maxFileSize: config.maxFileSize,
          maxTotalFiles: config.maxTotalFiles,
          requestTimeout: 30000,
          retryAttempts: 3,
          retryDelay: 1000,
        },
        logger || console
      );

      return await fetcher.fetchRepositoryContent(githubUrl, config);
    } catch (error: any) {
      // Log the error but don't throw it yet, try fallback
      if (logger) {
        logger.warn('GitHub API fetch failed, trying fallback method', {
          error: error.message,
          githubUrl,
        });
      }
    }
  }

  // Fallback to raw GitHub URL fetching when token is not available or API fails
  if (logger) {
    logger.info('Using fallback GitHub URL fetching method', { githubUrl });
  }

  return await fetchCodeFromGitHubUrlFallback(githubUrl, config, logger);
}

function validateGitHubUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return (
      urlObj.hostname === 'github.com' ||
      urlObj.hostname === 'raw.githubusercontent.com'
    );
  } catch {
    return false;
  }
}

// Fallback GitHub URL fetching when token is not available
async function fetchCodeFromGitHubUrlFallback(
  githubUrl: string,
  config: DocumentationConfig,
  logger?: any
): Promise<RepositoryContent> {
  try {
    // Only support single file URLs for fallback (blob URLs)
    if (!githubUrl.includes('/blob/')) {
      throw new Error(
        'Fallback method only supports individual file URLs (blob URLs). Repository URLs require GitHub API access with token.'
      );
    }

    const { username, repo, branch, filePath } = parseGitHubUrl(githubUrl);
    const content = await fetchCodeFromGitHubUrlDirect(githubUrl);

    if (!content) {
      throw new Error('Failed to fetch file content');
    }

    // Create a single file result matching the RepositoryContent interface
    const fileContent: FileContent = {
      path: filePath,
      content: content,
      size: Buffer.byteLength(content, 'utf8'),
      language: detectLanguageFromPath(filePath),
      sha: 'unknown', // We can't get the SHA from the raw content
    };

    return {
      files: [fileContent],
      totalSize: fileContent.size,
      skippedFiles: [],
      metadata: {
        repository: `${username}/${repo}`,
        branch: branch,
        fetchedAt: new Date().toISOString(),
        totalFiles: 1,
        processedFiles: 1,
      },
    };
  } catch (error: any) {
    if (logger) {
      logger.error('Fallback GitHub URL fetch failed', {
        githubUrl,
        error: error.message,
      });
    }
    throw new Error(`Failed to fetch GitHub content: ${error.message}`);
  }
}

async function fetchCodeFromGitHubUrlDirect(
  githubUrl: string
): Promise<string | null> {
  try {
    // Validate the URL before processing
    if (!validateGitHubUrlForFallback(githubUrl)) {
      throw new Error('Invalid GitHub URL format for fallback method');
    }

    const urlObj = new URL(githubUrl);

    if (urlObj.hostname === 'raw.githubusercontent.com') {
      return await fetchCodeText(githubUrl);
    } else {
      const { username, repo, branch, filePath } = parseGitHubUrl(githubUrl);
      // Construct the raw URL securely
      const rawUrl = new URL(
        `https://raw.githubusercontent.com/${encodeURIComponent(
          username
        )}/${encodeURIComponent(repo)}/${encodeURIComponent(
          branch
        )}/${filePath}`
      );
      return await fetchCodeText(rawUrl.toString());
    }
  } catch (error: any) {
    throw new Error(`Error fetching code from GitHub: ${error.message}`);
  }
}

function parseGitHubUrl(url: string): {
  username: string;
  repo: string;
  branch: string;
  filePath: string;
} {
  try {
    const urlObj = new URL(url);

    if (urlObj.hostname !== 'github.com') {
      throw new Error('Not a GitHub URL');
    }

    const pathParts = urlObj.pathname.split('/').filter(part => part);

    if (pathParts.length < 5 || pathParts[2] !== 'blob') {
      throw new Error('Invalid GitHub URL structure - must be a blob URL');
    }

    const username = pathParts[0];
    const repo = pathParts[1];
    const branch = pathParts[3];
    const filePath = pathParts.slice(4).join('/');

    return { username, repo, branch, filePath };
  } catch (error: any) {
    throw new Error(`Invalid GitHub URL: ${error.message}`);
  }
}

async function fetchCodeText(url: string): Promise<string> {
  try {
    // Validate URL format before fetching
    new URL(url);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch: ${response.status} ${response.statusText}`
      );
    }
    return await response.text();
  } catch (error: any) {
    throw new Error(`Error fetching code: ${error.message}`);
  }
}

function validateGitHubUrlForFallback(url: string): boolean {
  try {
    const urlObj = new URL(url);

    // Ensure the URL is from github.com or raw.githubusercontent.com
    if (
      urlObj.hostname !== 'github.com' &&
      urlObj.hostname !== 'raw.githubusercontent.com'
    ) {
      return false;
    }

    // Check for proper path structure for github.com blob URLs
    if (urlObj.hostname === 'github.com') {
      const pathParts = urlObj.pathname.split('/').filter(part => part);
      if (pathParts.length < 5 || pathParts[2] !== 'blob') {
        return false;
      }
    }

    return true;
  } catch (error) {
    return false;
  }
}

function detectLanguageFromPath(filePath: string): string | undefined {
  const extension = filePath.split('.').pop()?.toLowerCase();
  const languageMap: Record<string, string> = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    java: 'java',
    go: 'go',
    rs: 'rust',
    cpp: 'cpp',
    c: 'c',
    h: 'c',
    php: 'php',
    rb: 'ruby',
    swift: 'swift',
    kt: 'kotlin',
    cs: 'csharp',
    md: 'markdown',
    json: 'json',
    yaml: 'yaml',
    yml: 'yaml',
    xml: 'xml',
    html: 'html',
    css: 'css',
    scss: 'scss',
    sql: 'sql',
  };

  return extension ? languageMap[extension] : undefined;
}

export type { RepositoryContent, FileContent, DocumentationConfig };
