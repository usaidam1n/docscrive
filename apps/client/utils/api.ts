import axios from 'axios';
import crypto from 'crypto';
import { apiConfig } from '../lib/config';

function generateNonce(length: number = 16): string {
  return crypto.randomBytes(length).toString('hex');
}

function generateSignature(
  timestamp: string,
  nonce: string,
  body: any
): string {
  const payload = JSON.stringify({
    timestamp,
    nonce,
    body,
  });

  return crypto
    .createHmac('sha256', apiConfig.secret)
    .update(payload)
    .digest('hex');
}

const apiClient = axios.create({
  baseURL: apiConfig.baseUrl ?? '',
});

const nextApiClient = axios.create({
  baseURL:
    typeof window !== 'undefined'
      ? window.location.origin
      : 'http://localhost:3000',
  withCredentials: true,
});

nextApiClient.interceptors.request.use((config: any) => {
  config.headers = {
    ...config.headers,
    'Content-Type': 'application/json',
  };
  return config;
});

apiClient.interceptors.request.use((config: any) => {
  const timestamp = Date.now().toString();
  const nonce = generateNonce();
  const signature = generateSignature(timestamp, nonce, config.data || {});

  config.headers = {
    ...config.headers,
    'x-timestamp': timestamp,
    'x-nonce': nonce,
    'x-signature': signature,
  };

  return config;
});

// Default configuration for documentation generation
const DEFAULT_DOCUMENTATION_CONFIG = {
  includePatterns: ['**/*'],
  excludePatterns: ['node_modules/**', '.git/**', '*.log'],
  maxFileSize: 50000,
  maxTotalFiles: 100,
  style: 'comprehensive',
  includeCodeExamples: true,
  includeApiDocs: true,
  includeArchitecture: true,
  includeSetupInstructions: true,
  includeTroubleshooting: true,
  format: 'markdown',
  structure: 'hierarchical',
  includeTableOfContents: true,
  includeBadges: true,
  includeContributingGuide: true,
  temperature: 0.7,
  maxTokensPerFile: 2000,
  customPrompt: '',
  includePrivateFiles: false,
  generateDiagrams: false,
};

export const generateDocument = async (data: {
  basicDocument?: boolean;
  githubUrl?: string;
  textCode?: string;
  apiKey?: string;
  selectedModel?: {
    key: string;
    value: string;
  };
  repository?: {
    id: number;
    name: string;
    full_name: string;
    description: string | null;
    private: boolean;
    language: string | null;
    size: number;
    default_branch: string;
    owner: {
      id: number;
      login: string;
      avatar_url: string;
      type: string;
    };
  };
  configuration?: typeof DEFAULT_DOCUMENTATION_CONFIG;
}) => {
  try {
    // Validate required parameters
    if (!data.apiKey || !data.selectedModel) {
      throw new Error('apiKey and selectedModel are required');
    }
    console.log('Base data:', data);

    // Prepare base data without configuration first
    const { basicDocument, configuration, ...baseData } = data;
    // Only include configuration if not basicDocument
    const enhancedData = {
      ...baseData,
      ...(basicDocument
        ? {}
        : {
            configuration: {
              ...DEFAULT_DOCUMENTATION_CONFIG,
              ...configuration,
            },
          }),
    };
    console.log('Enhanced data:', enhancedData);
    // Use Next.js API route which includes GitHub token
    const response = await nextApiClient.post(
      '/api/generate-document',
      enhancedData
    );
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 403) {
      console.error('Security validation failed:', error.response.data);
    }
    throw error;
  }
};
