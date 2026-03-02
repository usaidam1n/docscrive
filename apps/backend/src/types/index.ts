import { z } from 'zod';
import { ModelSchema } from '../lib/utils.js';

// ─── AI Provider Types ───────────────────────────────────────────────────────

export interface AIProviderConfig {
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
}

// ─── Analysis Types ──────────────────────────────────────────────────────────

export interface AnalysisRequest {
  sourceType: 'code' | 'pullrequest';
  code?: string;
  pullRequestUrl?: string;
  language: string;
  options: AnalysisOptions;
  apiKey: string;
  selectedModel: z.infer<typeof ModelSchema>;
}

export interface AnalysisOptions {
  quality: boolean;
  security: boolean;
  performance: boolean;
  style: boolean;
  documentation: boolean;
  depth: 'quick' | 'standard' | 'deep';
}

export interface AnalysisIssue {
  id: string;
  severity: string;
  type: string;
  message: string;
  line: number;
  column: number;
  snippet: string;
  suggestion: string;
  fixExample: string;
}

export interface AnalysisSuggestion {
  id: string;
  title: string;
  description: string;
  priority: string;
}

export interface AnalysisMetrics {
  linesOfCode: number;
  cyclomaticComplexity: number;
  maintainabilityIndex: number;
  codeSmells: number;
  duplications: number;
}

export interface AnalysisResult {
  summary: {
    issuesCount: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
    quality: number;
    complexity: number;
    securityScore: number;
  };
  issues: AnalysisIssue[];
  metrics: AnalysisMetrics;
  suggestions: AnalysisSuggestion[];
  sourceType: string;
  sourceInfo?: {
    url: string;
    platform: string;
  };
  additionalComments?: string;
}

// ─── Documentation Types ─────────────────────────────────────────────────────

export type DocStyle =
  | 'comprehensive'
  | 'overview'
  | 'technical'
  | 'user-guide'
  | 'api-reference';

export type DocFormat = 'markdown' | 'html' | 'pdf' | 'confluence' | 'notion';

export interface DocumentationConfig {
  style?: DocStyle;
  format?: DocFormat;
  structure?: 'single-file' | 'hierarchical' | 'modular';
  includeCodeExamples?: boolean;
  includeApiDocs?: boolean;
  includeArchitecture?: boolean;
  includeSetupInstructions?: boolean;
  includeTroubleshooting?: boolean;
  includeTableOfContents?: boolean;
  includeBadges?: boolean;
  includeContributingGuide?: boolean;
  temperature?: number;
  customPrompt?: string;
  includePrivateFiles?: boolean;
  generateDiagrams?: boolean;
}

export interface RepositoryInfo {
  name: string;
  full_name?: string;
  description?: string | null;
  language?: string | null;
  topics?: string[];
  license?: {
    name: string;
    spdx_id?: string;
  } | null;
}

export interface RepositoryMetadata {
  processedFiles?: number;
  totalFiles?: number;
  totalSize?: number;
  primaryLanguage?: string;
}

// ─── Queue / Background Job Types ────────────────────────────────────────────

/**
 * Payload stored in BullMQ for a webhook-triggered documentation job.
 * jobId is derived from the commit SHA for idempotency (no double-processing
 * if GitHub retries the webhook).
 */
export interface DocJobPayload {
  repoFullName: string; // "owner/repo"
  branch: string; // "refs/heads/main"
  githubUrl: string; // "https://github.com/owner/repo"
  githubToken: string; // token used to fetch repo files
  userId: string; // "webhook-user" or real UUID if lookup added later
  organizationId: string | null;
  jobId: string; // commit SHA — used as BullMQ jobId (idempotent)
  triggeredAt: string; // ISO timestamp
}

// ─── Error Types ─────────────────────────────────────────────────────────────

export interface ErrorResponse {
  error: string;
  message: string;
  details?: string;
}

// ─── Health Check Types ──────────────────────────────────────────────────────

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  service: string;
  version: string;
  uptime: number;
  checks: Record<
    string,
    {
      status: 'pass' | 'fail';
      message?: string;
    }
  >;
}
