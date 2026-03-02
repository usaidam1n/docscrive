export interface DocumentationConfiguration {
  // File filtering
  includePatterns: string[];
  excludePatterns: string[];
  maxFileSize: number; // in bytes
  maxTotalFiles: number;

  // Documentation style
  style:
    | 'comprehensive'
    | 'overview'
    | 'technical'
    | 'user-guide'
    | 'api-reference';
  includeCodeExamples: boolean;
  includeApiDocs: boolean;
  includeArchitecture: boolean;
  includeSetupInstructions: boolean;
  includeTroubleshooting: boolean;

  // Output configuration
  format: 'markdown' | 'html' | 'pdf' | 'confluence' | 'notion';
  structure: 'single-file' | 'hierarchical' | 'modular';
  includeTableOfContents: boolean;
  includeBadges: boolean;
  includeContributingGuide: boolean;

  // Advanced options
  aiModel: string;
  temperature: number;
  maxTokensPerFile: number;
  includePrivateFiles: boolean;
  generateDiagrams: boolean;
  customPrompt: string;

  // Processing options
  batchSize: number;
  concurrency: number;
  timeout: number; // in milliseconds

  // Webhook / Sync options
  enableAutoSync: boolean;
}

export interface DocumentationTemplate {
  id: string;
  name: string;
  description: string;
  config: Partial<DocumentationConfiguration>;
  tags: string[];
  isBuiltIn: boolean;
}

export interface FileAnalysis {
  path: string;
  size: number;
  language: string;
  complexity: number;
  isIncluded: boolean;
  skipReason?: string;
  estimatedTokens: number;
}

export interface RepositoryAnalysis {
  totalFiles: number;
  includedFiles: number;
  excludedFiles: number;
  totalSize: number;
  languages: Record<string, number>;
  fileAnalysis: FileAnalysis[];
  estimatedProcessingTime: number;
  estimatedTokenUsage: number;
}

export interface DocumentationProgress {
  id: string;
  status:
    | 'initializing'
    | 'authenticating'
    | 'fetching'
    | 'analyzing'
    | 'processing'
    | 'generating'
    | 'completed'
    | 'failed';
  progress: number; // 0-100
  currentStep: string;
  processedFiles: number;
  totalFiles: number;
  estimatedTimeRemaining?: number;
  error?: string;
  startedAt: string;
  completedAt?: string;
  warnings: string[];
}

export interface GeneratedDocumentation {
  id: string;
  repositoryId: string;
  configuration: DocumentationConfiguration;
  content: string;
  metadata: {
    generatedAt: string;
    processingTime: number;
    tokenUsage: number;
    fileCount: number;
    warnings: string[];
  };
  sections: DocumentationSection[];
}

export interface DocumentationSection {
  id: string;
  title: string;
  content: string;
  type:
    | 'overview'
    | 'setup'
    | 'api'
    | 'examples'
    | 'architecture'
    | 'troubleshooting'
    | 'contributing';
  order: number;
  subsections?: DocumentationSection[];
}

export interface ConfigurationValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  score: number; // 0-100
}

export interface DocumentationPreset {
  name: string;
  description: string;
  icon: string;
  config: Partial<DocumentationConfiguration>;
  suitable: string[]; // repository types this preset is suitable for
}
