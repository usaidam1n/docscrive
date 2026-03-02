export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: Record<string, unknown>;
}

export interface ModelConfig {
  key: string;
  value: string;
  label?: string;
}

export interface LocalModelConfig {
  url: string;
  model: string;
  apiKey?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface GenerateDocumentRequest {
  githubUrl?: string;
  textCode?: string;
  apiKey: string;
  selectedModel: ModelConfig;
}

export interface TranslateCodeRequest {
  code: string;
  language: string;
  apiKey: string;
  selectedModel: ModelConfig;
}

export interface AnalyzeCodeRequest {
  sourceType: string;
  pullRequestUrl?: string;
  code?: string;
  language: string;
  options: {
    quality: boolean;
    security: boolean;
    performance: boolean;
    style: boolean;
    documentation: boolean;
    depth: string;
  };
  apiKey: string;
  selectedModel: ModelConfig;
}

export interface CodeAnalysisResult {
  summary: string;
  issues: Array<{
    type: 'quality' | 'security' | 'performance' | 'style' | 'documentation';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    line?: number;
    suggestion?: string;
  }>;
  metrics: {
    complexity: number;
    maintainability: number;
    reliability: number;
    security: number;
  };
}

export interface User {
  id: string;
  email?: string;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    defaultModel: ModelConfig;
    language: string;
  };
}

// Environment Variables
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_API_SECRET: string;
      NEXT_PUBLIC_DOCSCRIVE_API: string;
      NEXT_PUBLIC_UMAMI_SCRIPT_URL?: string;
      NEXT_PUBLIC_UMAMI_WEBSITE_ID?: string;
      NEXT_PUBLIC_SENTRY_DSN?: string;
      NEXT_PUBLIC_APP_ENV: 'development' | 'staging' | 'production';
      NODE_ENV: 'development' | 'production' | 'test';
    }
  }
}

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Component Props
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
  'data-testid'?: string;
}

export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchParams {
  query: string;
  filters?: Record<string, unknown>;
}
