import { Response } from 'express';
import { z } from 'zod';
import axios from 'axios';
import { URL } from 'url';
import logger from './logger.js';

export type ModelRecord = {
  openai: readonly string[];
  google: readonly string[];
  anthropic: readonly string[];
};

/**
 * Estimates the number of tokens in a text string.
 * Uses a simple approximation of 4 characters per token.
 */
export function estimateTokenCount(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

/**
 * Safely validates and parses a GitHub URL
 */
function validateGitHubUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);

    // Ensure the URL is from github.com or raw.githubusercontent.com
    if (
      urlObj.hostname !== 'github.com' &&
      urlObj.hostname !== 'raw.githubusercontent.com'
    ) {
      return false;
    }

    // Check for proper path structure for github.com
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

/**
 * Safely validates and parses a Pull Request URL
 */
function validatePullRequestUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);

    // Validate GitHub PR URL
    if (urlObj.hostname === 'github.com') {
      const pathParts = urlObj.pathname.split('/').filter(part => part);
      return (
        pathParts.length >= 4 &&
        pathParts[2] === 'pull' &&
        /^\d+$/.test(pathParts[3])
      );
    }

    // Validate GitLab MR URL
    if (urlObj.hostname === 'gitlab.com') {
      const pathParts = urlObj.pathname.split('/').filter(part => part);
      return (
        pathParts.length >= 4 &&
        pathParts[pathParts.length - 2] === 'merge_requests' &&
        /^\d+$/.test(pathParts[pathParts.length - 1])
      );
    }

    // Validate Azure DevOps PR URL
    if (
      urlObj.hostname.includes('dev.azure.com') ||
      urlObj.hostname.includes('visualstudio.com')
    ) {
      return (
        urlObj.pathname.includes('pullrequest') &&
        /\/\d+$/.test(urlObj.pathname)
      );
    }

    // Other PR platforms could be validated here

    return false;
  } catch (error) {
    return false;
  }
}

export const AVAILABLE_MODELS: ModelRecord = {
  openai: ['o1', 'o1-mini', 'gpt-4o-mini', 'gpt-4o'],
  google: ['gemini-pro', 'gemini-2.5-flash'],
  anthropic: [
    'claude-3-opus-latest',
    'claude-3-5-haiku-latest',
    'claude-3-5-sonnet-latest',
    'claude-4-5-sonnet-latest',
  ],
};

export const ModelSchema = z
  .object({
    key: z.enum(['openai', 'google', 'anthropic']),
    value: z.string(),
  })
  .refine(
    data => {
      return AVAILABLE_MODELS[data.key].includes(data.value);
    },
    {
      message: 'Invalid model for the selected provider',
    }
  );

export const BaseRequestSchema = z.object({
  apiKey: z.string().optional(),
  selectedModel: ModelSchema.optional(),
});

// Enhanced DocumentRequestSchema with comprehensive configuration support
export const DocumentRequestSchema = BaseRequestSchema.extend({
  url: z.union([z.string().url(), z.literal('')]).optional(),
  githubUrl: z
    .union([z.string().url(), z.literal('')])
    .optional()
    .refine(
      url => !url || validateGitHubUrl(url),
      {
        message:
          'githubUrl must be a GitHub repository URL (github.com or raw.githubusercontent.com)',
      }
    ),
  textCode: z.string().optional(),

  // User's GitHub token (sent from Next.js proxy)
  githubToken: z.string().optional(),

  // User context (sent from Next.js proxy)
  userContext: z
    .object({
      userId: z.string(),
      username: z.string(),
    })
    .optional(),

  // Repository metadata
  repository: z
    .object({
      id: z.number(),
      name: z.string(),
      full_name: z.string(),
      description: z.string().nullable(),
      private: z.boolean(),
      language: z.string().nullable(),
      size: z.number(),
      default_branch: z.string(),
      owner: z.object({
        id: z.number(),
        login: z.string(),
        avatar_url: z.string(),
        type: z.string(),
      }),
      // Additional repository metadata
      fork: z.boolean().optional(),
      archived: z.boolean().optional(),
      visibility: z.enum(['public', 'private', 'internal']).optional(),
      topics: z.array(z.string()).optional(),
      license: z
        .object({
          key: z.string(),
          name: z.string(),
          spdx_id: z.string(),
        })
        .nullable()
        .optional(),
    })
    .optional(),

  // Comprehensive documentation configuration
  configuration: z
    .object({
      // File filtering configuration
      includePatterns: z
        .array(z.string())
        .min(1, 'At least one include pattern is required'),
      excludePatterns: z.array(z.string()).default([]),
      maxFileSize: z
        .number()
        .positive('Max file size must be positive')
        .max(10 * 1024 * 1024, 'Max file size cannot exceed 10MB'),
      maxTotalFiles: z
        .number()
        .positive('Max total files must be positive')
        .max(1000, 'Max total files cannot exceed 1000'),

      // Documentation style configuration
      style: z
        .enum([
          'comprehensive',
          'overview',
          'technical',
          'user-guide',
          'api-reference',
        ])
        .default('comprehensive'),
      includeCodeExamples: z.boolean().default(true),
      includeApiDocs: z.boolean().default(true),
      includeArchitecture: z.boolean().default(true),
      includeSetupInstructions: z.boolean().default(true),
      includeTroubleshooting: z.boolean().default(true),

      // Output configuration
      format: z.enum(['markdown', 'pdf']).default('markdown'),
      structure: z
        .enum(['single-file', 'hierarchical', 'modular'])
        .default('single-file'),
      includeTableOfContents: z.boolean().default(true),
      includeBadges: z.boolean().default(true),
      includeContributingGuide: z.boolean().default(false),

      // Advanced AI configuration
      aiModel: z.string().min(1, 'AI model is required').optional(),
      temperature: z
        .number()
        .min(0, 'Temperature must be >= 0')
        .max(2, 'Temperature must be <= 2')
        .default(0.3),
      maxTokensPerFile: z
        .number()
        .positive('Max tokens per file must be positive')
        .max(100000, 'Max tokens per file cannot exceed 100k')
        .default(4000),
      includePrivateFiles: z.boolean().default(false),
      generateDiagrams: z.boolean().default(false),
      customPrompt: z.string().default(''),

      // Processing configuration
      batchSize: z
        .number()
        .positive('Batch size must be positive')
        .max(50, 'Batch size cannot exceed 50')
        .default(10),
      concurrency: z
        .number()
        .positive('Concurrency must be positive')
        .max(10, 'Concurrency cannot exceed 10')
        .default(3),
      timeout: z
        .number()
        .positive('Timeout must be positive')
        .max(600000, 'Timeout cannot exceed 10 minutes')
        .default(300000),
    })
    .optional()
    .refine(
      config => {
        if (!config) return true;
        // Validate that if private files are included, appropriate patterns are set
        if (
          config.includePrivateFiles &&
          !config.includePatterns.some(
            pattern => pattern.includes('private') || pattern.includes('secret')
          )
        ) {
          return false;
        }
        return true;
      },
      {
        message:
          'When including private files, ensure appropriate patterns are configured',
        path: ['includePrivateFiles'],
      }
    ),
})
  .refine(data => data.url || data.githubUrl || data.textCode, {
    message: 'At least one of url, githubUrl, or textCode must be provided',
  })
  .refine(
    data => {
      if (!data.apiKey || !data.selectedModel) {
        return false;
      }
      return true;
    },
    {
      message: 'apiKey and selectedModel are required',
    }
  );

export const TranslationRequestSchema = BaseRequestSchema.extend({
  code: z.string(),
  language: z.string(),
}).refine(
  data => {
    if (!data.apiKey || !data.selectedModel) {
      return false;
    }
    return true;
  },
  {
    message: 'apiKey and selectedModel are required',
  }
);

export const CodeReviewRequestSchema = z.object({
  sourceType: z.enum(['code', 'pullrequest']),
  code: z.string().optional(),
  pullRequestUrl: z
    .string()
    .url()
    .optional()
    .refine(url => !url || validatePullRequestUrl(url), {
      message: 'Invalid pull request URL format',
    }),
  language: z.string(),
  options: z.object({
    quality: z.boolean().default(true),
    security: z.boolean().default(true),
    performance: z.boolean().default(true),
    style: z.boolean().default(true),
    documentation: z.boolean().default(true),
    depth: z.enum(['quick', 'standard', 'deep']).default('standard'),
  }),
  apiKey: z.string(),
  selectedModel: ModelSchema,
});

/**
 * Fetches code changes from a pull request across different platforms with enhanced security
 */
export async function fetchCodeFromPullRequest(
  prUrl: string,
  apiToken?: string
): Promise<string> {
  try {
    // Validate the URL first
    if (!validatePullRequestUrl(prUrl)) {
      throw new Error('Invalid pull request URL format');
    }

    const urlObj = new URL(prUrl);

    // GitHub pull request
    if (urlObj.hostname === 'github.com') {
      return await fetchGitHubPullRequest(prUrl, apiToken);
    }

    // GitLab merge request
    if (urlObj.hostname === 'gitlab.com') {
      return await fetchGitLabMergeRequest(prUrl, apiToken);
    }

    // Azure DevOps pull request
    if (
      urlObj.hostname.includes('dev.azure.com') ||
      urlObj.hostname.includes('visualstudio.com')
    ) {
      return await fetchAzureDevOpsPullRequest(prUrl, apiToken);
    }

    // Gerrit review - enhanced validation
    if (prUrl.includes('/c/') && prUrl.includes('/+/')) {
      const gerritPathPattern = /\/c\/[^/]+\/\+\/\d+/;
      if (!gerritPathPattern.test(urlObj.pathname)) {
        throw new Error('Invalid Gerrit review URL format');
      }
      return await fetchGerritReview(prUrl, apiToken);
    }

    throw new Error('Unsupported pull request URL format');
  } catch (error) {
    logger.error({ error }, 'Error fetching pull request');
    throw new Error(
      `Failed to fetch pull request: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

/**
 * Fetches code changes from a GitHub pull request with enhanced security
 */
async function fetchGitHubPullRequest(
  prUrl: string,
  apiToken?: string
): Promise<string> {
  try {
    const urlObj = new URL(prUrl);
    const pathParts = urlObj.pathname.split('/').filter(part => part);

    if (
      pathParts.length < 4 ||
      pathParts[2] !== 'pull' ||
      !/^\d+$/.test(pathParts[3])
    ) {
      throw new Error('Invalid GitHub pull request URL format');
    }

    const owner = pathParts[0];
    const repo = pathParts[1];
    const pullNumber = pathParts[3];

    const apiUrl = `https://api.github.com/repos/${encodeURIComponent(
      owner
    )}/${encodeURIComponent(repo)}/pulls/${encodeURIComponent(
      pullNumber
    )}/files`;

    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
    };

    if (apiToken) {
      headers['Authorization'] = `token ${apiToken}`;
    }

    const response = await axios.get(apiUrl, { headers });

    // Process the files and build a combined code diff
    const files = response.data;
    if (!Array.isArray(files) || files.length === 0) {
      throw new Error('No changed files found in pull request');
    }

    let combinedCode = '';

    for (const file of files) {
      const fileName = file.filename;
      const patch = file.patch || '';
      const rawUrl = file.raw_url;

      // Add file info to the combined code
      combinedCode += `\n\n--- File: ${fileName} ---\n`;

      // If the patch is available, add it
      if (patch) {
        combinedCode += patch;
      } else if (rawUrl) {
        // Validate raw URL before fetching
        try {
          new URL(rawUrl);
          const fileResponse = await axios.get(rawUrl, { headers });
          combinedCode += fileResponse.data;
        } catch (error) {
          combinedCode += `[Content unavailable: ${
            error instanceof Error ? error.message : 'Unknown error'
          }]`;
        }
      } else {
        combinedCode += '[No content available]';
      }
    }

    return combinedCode;
  } catch (error) {
    throw new Error(
      `GitHub PR fetch error: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

/**
 * Fetches code changes from a GitLab merge request with enhanced security
 */
async function fetchGitLabMergeRequest(
  mrUrl: string,
  apiToken?: string
): Promise<string> {
  try {
    const urlObj = new URL(mrUrl);
    const pathParts = urlObj.pathname.split('/').filter(part => part);

    // Ensure proper GitLab MR URL format
    if (
      pathParts.length < 4 ||
      pathParts[pathParts.length - 2] !== 'merge_requests' ||
      !/^\d+$/.test(pathParts[pathParts.length - 1])
    ) {
      throw new Error('Invalid GitLab merge request URL format');
    }

    // Extract project path (everything before merge_requests)
    const mrIdIndex = pathParts.indexOf('merge_requests');
    const projectPath = pathParts.slice(0, mrIdIndex - 1).join('/');
    const mrId = pathParts[mrIdIndex + 1];

    const encodedProjectPath = encodeURIComponent(projectPath);
    const apiUrl = `https://gitlab.com/api/v4/projects/${encodedProjectPath}/merge_requests/${encodeURIComponent(
      mrId
    )}/changes`;

    const headers: Record<string, string> = {};

    if (apiToken) {
      headers['PRIVATE-TOKEN'] = apiToken;
    }

    const response = await axios.get(apiUrl, { headers });

    // Process the changes
    const { changes } = response.data;
    if (!Array.isArray(changes) || changes.length === 0) {
      throw new Error('No changed files found in merge request');
    }

    let combinedCode = '';

    for (const change of changes) {
      const { new_path, diff } = change;

      // Add file info and diff to the combined code
      combinedCode += `\n\n--- File: ${new_path} ---\n`;
      combinedCode += diff || '[No diff available]';
    }

    return combinedCode;
  } catch (error) {
    throw new Error(
      `GitLab MR fetch error: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

/**
 * Fetches code changes from an Azure DevOps pull request with enhanced security
 */
async function fetchAzureDevOpsPullRequest(
  prUrl: string,
  apiToken?: string
): Promise<string> {
  try {
    const urlObj = new URL(prUrl);

    // Parse Azure DevOps URL format
    let organization, project, repository, pullRequestId;

    if (urlObj.hostname.includes('dev.azure.com')) {
      // dev.azure.com format
      const pathParts = urlObj.pathname.split('/').filter(part => part);
      if (pathParts.length < 5 || !pathParts.includes('pullrequest')) {
        throw new Error('Invalid Azure DevOps pull request URL format');
      }

      const prIndex = pathParts.indexOf('pullrequest');
      organization = pathParts[0];
      project = pathParts[1];
      repository = pathParts[3]; // Assuming _git is at index 2
      pullRequestId = pathParts[prIndex + 1];
    } else if (urlObj.hostname.includes('visualstudio.com')) {
      // visualstudio.com format
      const hostParts = urlObj.hostname.split('.');
      organization = hostParts[0];

      const pathParts = urlObj.pathname.split('/').filter(part => part);
      if (pathParts.length < 5 || !pathParts.includes('pullrequest')) {
        throw new Error('Invalid Azure DevOps pull request URL format');
      }

      const prIndex = pathParts.indexOf('pullrequest');
      project = pathParts[0];
      repository = pathParts[2]; // Assuming _git is at index 1
      pullRequestId = pathParts[prIndex + 1];
    } else {
      throw new Error('Unsupported Azure DevOps URL format');
    }

    if (
      !organization ||
      !project ||
      !repository ||
      !pullRequestId ||
      !/^\d+$/.test(pullRequestId)
    ) {
      throw new Error(
        'Could not extract required parameters from Azure DevOps URL'
      );
    }

    const apiUrl = `https://dev.azure.com/${encodeURIComponent(
      organization
    )}/${encodeURIComponent(
      project
    )}/_apis/git/repositories/${encodeURIComponent(
      repository
    )}/pullRequests/${encodeURIComponent(
      pullRequestId
    )}/iterations/1/changes?api-version=6.0`;

    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    if (apiToken) {
      const encodedToken = Buffer.from(`:${apiToken}`).toString('base64');
      headers['Authorization'] = `Basic ${encodedToken}`;
    }

    const response = await axios.get(apiUrl, { headers });

    // Process the changes
    const { changes } = response.data;
    if (!Array.isArray(changes) || changes.length === 0) {
      throw new Error('No changed files found in pull request');
    }

    let combinedCode = '';

    for (const change of changes) {
      const { item } = change;
      if (item) {
        const path = item.path;

        // Add file info to the combined code
        combinedCode += `\n\n--- File: ${path} ---\n`;

        // Fetch the actual content of the file in this iteration
        try {
          const contentUrl = `https://dev.azure.com/${encodeURIComponent(
            organization
          )}/${encodeURIComponent(
            project
          )}/_apis/git/repositories/${encodeURIComponent(
            repository
          )}/pullRequests/${encodeURIComponent(
            pullRequestId
          )}/iterations/1/changes/${encodeURIComponent(
            path
          )}/content?api-version=6.0`;
          const contentResponse = await axios.get(contentUrl, { headers });
          combinedCode += contentResponse.data;
        } catch (error) {
          combinedCode += `[Content unavailable: ${
            error instanceof Error ? error.message : 'Unknown error'
          }]`;
        }
      }
    }

    return combinedCode;
  } catch (error) {
    throw new Error(
      `Azure DevOps PR fetch error: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

/**
 * Fetches code changes from a Gerrit review with enhanced security
 */
async function fetchGerritReview(
  reviewUrl: string,
  apiToken?: string
): Promise<string> {
  try {
    const urlObj = new URL(reviewUrl);

    // Validate Gerrit review URL format
    const pathParts = urlObj.pathname.split('/').filter(part => part);
    if (
      pathParts.length < 4 ||
      pathParts[0] !== 'c' ||
      pathParts[2] !== '+' ||
      !/^\d+$/.test(pathParts[3])
    ) {
      throw new Error('Invalid Gerrit review URL format');
    }

    const host = urlObj.hostname;
    const project = pathParts[1];
    const changeId = pathParts[3];

    // Gerrit uses a REST API with the /changes/ endpoint
    const apiUrl = `https://${encodeURIComponent(
      host
    )}/changes/${encodeURIComponent(project)}~${encodeURIComponent(
      changeId
    )}/revisions/current/files`;

    const headers: Record<string, string> = {};

    if (apiToken) {
      headers['Authorization'] = `Bearer ${apiToken}`;
    }

    // Gerrit prefixes the response with ")]}'" to prevent XSSI
    const response = await axios.get(apiUrl, { headers });
    let responseData = response.data;
    if (typeof responseData === 'string' && responseData.startsWith(")]}'")) {
      responseData = JSON.parse(responseData.substring(4));
    }

    // Process the files
    const files = responseData;
    if (!files || Object.keys(files).length === 0) {
      throw new Error('No changed files found in Gerrit review');
    }

    let combinedCode = '';

    for (const [filePath, fileInfo] of Object.entries(files)) {
      // Skip /COMMIT_MSG
      if (filePath === '/COMMIT_MSG') continue;

      // Add file info to the combined code
      combinedCode += `\n\n--- File: ${filePath} ---\n`;

      // Fetch the actual content of the file in this revision
      try {
        const contentUrl = `https://${encodeURIComponent(
          host
        )}/changes/${encodeURIComponent(project)}~${encodeURIComponent(
          changeId
        )}/revisions/current/files/${encodeURIComponent(filePath)}/content`;
        const contentResponse = await axios.get(contentUrl, {
          headers,
          responseType: 'text',
        });
        let content = contentResponse.data;

        // If content is base64-encoded
        if (typeof content === 'string' && content.startsWith(")]}'")) {
          content = content.substring(4);
        }

        // Gerrit may return base64-encoded content
        try {
          content = Buffer.from(content, 'base64').toString('utf-8');
        } catch (e) {
          // If not base64, use as is
        }

        combinedCode += content;
      } catch (error) {
        combinedCode += `[Content unavailable: ${
          error instanceof Error ? error.message : 'Unknown error'
        }]`;
      }
    }

    return combinedCode;
  } catch (error) {
    throw new Error(
      `Gerrit review fetch error: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

/**
 * Detects which platform a pull request URL is from
 */
export function detectPlatform(url: string): string {
  try {
    const urlObj = new URL(url);

    if (urlObj.hostname === 'github.com') {
      return 'GitHub';
    } else if (urlObj.hostname === 'gitlab.com') {
      return 'GitLab';
    } else if (
      urlObj.hostname.includes('dev.azure.com') ||
      urlObj.hostname.includes('visualstudio.com')
    ) {
      return 'Azure DevOps';
    } else if (url.includes('/c/') && url.includes('/+/')) {
      return 'Gerrit';
    } else {
      return 'Unknown';
    }
  } catch (error) {
    return 'Invalid URL';
  }
}

export function handleError(res: Response, error: any) {
  if (error instanceof z.ZodError) {
    return res
      .status(400)
      .json({ error: 'Validation error', details: error.errors });
  }
  return res.status(500).json({
    error: 'Internal server error',
    message: error.message || 'Unknown error',
  });
}

// Enhanced default configuration with comprehensive options
export function getDefaultConfiguration() {
  return {
    // File filtering configuration
    includePatterns: [
      '**/*.{js,ts,jsx,tsx,py,java,go,rs,cpp,c,h,hpp,cs,php,rb,swift,kt}',
      '**/*.{json,yaml,yml,xml,toml,ini,env}',
      '**/*.{md,txt,rst,adoc}',
      '**/README*',
      '**/CHANGELOG*',
      '**/LICENSE*',
      '**/package.json',
      '**/Cargo.toml',
      '**/pom.xml',
      '**/requirements.txt',
      '**/Dockerfile*',
      '**/*.dockerfile',
    ],
    excludePatterns: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'target/**',
      'out/**',
      '.git/**',
      '.svn/**',
      '.hg/**',
      'coverage/**',
      '__pycache__/**',
      '*.pyc',
      '**/*.test.*',
      '**/*.spec.*',
      '**/*.min.*',
      '**/*.map',
      '**/.DS_Store',
      '**/Thumbs.db',
      '**/*.log',
      '**/*.cache',
      '**/*.tmp',
      '**/*.temp',
    ],
    maxFileSize: 2 * 1024 * 1024, // 2MB - increased for better coverage
    maxTotalFiles: 500,

    // Documentation style configuration
    style: 'comprehensive' as const,
    includeCodeExamples: true,
    includeApiDocs: true,
    includeArchitecture: true,
    includeSetupInstructions: true,
    includeTroubleshooting: true,

    // Output configuration
    format: 'markdown' as 'markdown' | 'pdf',
    structure: 'single-file' as 'single-file' | 'hierarchical' | 'modular',
    includeTableOfContents: true,
    includeBadges: true,
    includeContributingGuide: false,

    // Advanced AI configuration
    aiModel: 'claude-3-5-sonnet-latest', // Default to high-quality model
    temperature: 0.3,
    maxTokensPerFile: 4000,
    includePrivateFiles: false,
    generateDiagrams: false,
    customPrompt: '',

    // Processing configuration
    batchSize: 10,
    concurrency: 3,
    timeout: 300000, // 5 minutes
  };
}
