import { Worker, Job } from 'bullmq';
import { appConfig } from '../config/index.js';
import logger from '../lib/logger.js';
import { bullConnection } from '../lib/queue.js';
import { fetchCodeFromGitHubUrl } from '../services/github-repository-fetcher.js';
import { AIServiceFactory } from '../factories/ai-service-factory.js';
import { getDefaultConfiguration, estimateTokenCount } from '../lib/utils.js';
import type { DocJobPayload } from '../types/index.js';

// ─── Constants ───────────────────────────────────────────────────────────────

const MAX_CONTEXT_TOKENS = 120_000;

const PRIORITY_PATTERNS = [
  /readme\.md$/i,
  /package\.json$/,
  /tsconfig\.json$/,
  /index\.(ts|js|tsx|jsx)$/,
  /main\.(ts|js|go|py)$/,
  /app\.(ts|js|py)$/,
  /server\.(ts|js)$/,
  /api\//,
  /routes\//,
  /models\//,
  /types\//,
  /interfaces\//,
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getFilePriority(path: string): number {
  for (let i = 0; i < PRIORITY_PATTERNS.length; i++) {
    if (PRIORITY_PATTERNS[i].test(path)) return i;
  }
  return 999;
}

// ─── Job Processor ───────────────────────────────────────────────────────────

async function processDocJob(job: Job<DocJobPayload>): Promise<void> {
  const { repoFullName, branch, githubUrl, githubToken } = job.data;
  const jobLog = logger.child({ jobId: job.id, repo: repoFullName });

  jobLog.info({ branch }, 'Starting documentation job');

  // ── 1. Validate worker AI config ──────────────────────────────────────────
  const { apiKey, model, provider } = appConfig.queue.worker;
  if (!apiKey) {
    throw new Error(
      'WORKER_AI_API_KEY is not configured. Cannot process documentation job.'
    );
  }

  // ── 2. Fetch repository content ────────────────────────────────────────────
  const config = getDefaultConfiguration();

  let repositoryContent;
  try {
    repositoryContent = await fetchCodeFromGitHubUrl(
      githubUrl,
      {
        includePatterns: config.includePatterns,
        excludePatterns: config.excludePatterns,
        maxFileSize: config.maxFileSize,
        maxTotalFiles: config.maxTotalFiles,
        includePrivateFiles: config.includePrivateFiles,
      },
      githubToken,
      jobLog
    );
  } catch (err) {
    jobLog.error({ err }, 'Failed to fetch repository content');
    throw err; // BullMQ will retry
  }

  if (!repositoryContent?.files?.length) {
    throw new Error(`No processable files found in repository ${repoFullName}`);
  }

  jobLog.info(
    { totalFiles: repositoryContent.files.length },
    'Repository content fetched'
  );

  // ── 3. Smart context management (token budget) ────────────────────────────
  let currentTokens = 0;
  const processedFiles: string[] = [];
  const skippedFiles: string[] = [];

  const sortedFiles = [...repositoryContent.files].sort((a, b) => {
    const pa = getFilePriority(a.path);
    const pb = getFilePriority(b.path);
    return pa !== pb ? pa - pb : a.path.localeCompare(b.path);
  });

  const codeContent = sortedFiles
    .map(file => {
      if (currentTokens >= MAX_CONTEXT_TOKENS) {
        skippedFiles.push(file.path);
        return null;
      }

      const header = `// File: ${file.path}\n`;
      const headerTokens = estimateTokenCount(header);
      const contentTokens = estimateTokenCount(file.content);

      if (currentTokens + headerTokens + contentTokens > MAX_CONTEXT_TOKENS) {
        const remaining = MAX_CONTEXT_TOKENS - currentTokens - headerTokens;
        if (remaining < 100) {
          skippedFiles.push(file.path);
          return null;
        }
        const truncated = file.content.slice(0, remaining * 4);
        currentTokens += headerTokens + estimateTokenCount(truncated);
        processedFiles.push(file.path);
        return `${header}${truncated}\n// ... content truncated due to context limits ...`;
      }

      currentTokens += headerTokens + contentTokens;
      processedFiles.push(file.path);
      return `${header}${file.content}`;
    })
    .filter(Boolean)
    .join('\n\n');

  if (skippedFiles.length > 0) {
    jobLog.warn(
      { count: skippedFiles.length },
      'Files skipped due to token limit'
    );
  }

  // ── 4. Generate documentation ─────────────────────────────────────────────
  const repoName = repoFullName.split('/')[1] ?? repoFullName;
  const aiService = AIServiceFactory.createCloudAIService(
    { key: provider as 'openai' | 'google' | 'anthropic', value: model },
    apiKey
  );

  const result = await aiService.generateDocumentation({
    projectName: repoName,
    projectDescription: `Webhook-triggered documentation for ${repoFullName}`,
    codebase: codeContent,
    configuration: config,
    repository: {
      name: repoName,
      full_name: repoFullName,
    },
    userContext: {
      userId: job.data.userId,
      username: 'webhook-worker',
    },
    repositoryMetadata: {
      processedFiles: processedFiles.length,
      totalFiles: repositoryContent.files.length,
      totalSize: repositoryContent.totalSize,
    },
  });

  if (result.error) {
    throw new Error(`AI service error: ${result.message}`);
  }

  jobLog.info(
    {
      docLength: result.text?.length,
      processedFiles: processedFiles.length,
      skippedFiles: skippedFiles.length,
    },
    'Documentation job completed successfully'
  );

  // TODO: persist result.text to database / storage here
  // e.g. await db.documentation.upsert({ repoFullName, branch, content: result.text })
}

// ─── Worker Instance ─────────────────────────────────────────────────────────

export function createDocWorker(): Worker<DocJobPayload> {
  const worker = new Worker<DocJobPayload>(
    appConfig.queue.name,
    processDocJob,
    {
      connection: bullConnection as any,
      concurrency: appConfig.queue.concurrency,
    }
  );

  worker.on('completed', job => {
    logger.info(
      { jobId: job.id, repo: job.data.repoFullName },
      'Doc job completed'
    );
  });

  worker.on('failed', (job, err) => {
    logger.error(
      { jobId: job?.id, repo: job?.data.repoFullName, err },
      'Doc job failed'
    );
  });

  worker.on('error', err => {
    logger.error({ err }, 'Worker error');
  });

  logger.info(
    { concurrency: appConfig.queue.concurrency, queue: appConfig.queue.name },
    'Documentation worker started'
  );

  return worker;
}
