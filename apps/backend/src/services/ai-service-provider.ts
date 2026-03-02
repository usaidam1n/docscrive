import { z } from 'zod';
import { PromptBuilder } from './prompt-builder.js';
import { IAIProvider } from './providers/IAIProvider.js';
import { OpenAIProvider } from './providers/OpenAIProvider.js';
import { GoogleProvider } from './providers/GoogleProvider.js';
import { AnthropicProvider } from './providers/AnthropicProvider.js';
import logger from '../lib/logger.js';
import { responseCache, makeCacheKey } from '../lib/cache.js';
import { recordAICall } from '../routes/metrics.js';

export type AIProviderType = 'openai' | 'google' | 'anthropic';

export interface AIResponse {
  text?: string;
  error?: boolean;
  message?: string;
  details?: string;
}

class AIServiceProvider {
  private provider: IAIProvider;

  constructor(providerType: AIProviderType, config: any) {
    switch (providerType) {
      case 'openai':
        this.provider = new OpenAIProvider(config);
        break;
      case 'google':
        this.provider = new GoogleProvider(config);
        break;
      case 'anthropic':
        this.provider = new AnthropicProvider(config);
        break;
      default:
        throw new Error(`Unsupported provider: ${providerType}`);
    }
  }

  async getResponse(prompt: string): Promise<AIResponse> {
    return this.provider.getResponse(prompt);
  }
}

export class AIService {
  private provider: AIServiceProvider;
  private providerName: string;

  constructor(provider: AIProviderType, config: any) {
    this.provider = new AIServiceProvider(provider, config);
    this.providerName = provider;
  }

  /**
   * Generate technical documentation for a project.
   * Results are cached for 1 hour to save AI costs on repeated identical requests.
   */
  async generateDocumentation(params: {
    projectName: string;
    projectDescription: string;
    codebase: string;
    configuration?: any;
    repository?: any;
    userContext?: any;
    repositoryMetadata?: any;
  }): Promise<AIResponse> {
    // Check cache
    const cacheKey = makeCacheKey(
      'doc',
      params.codebase,
      params.configuration,
      params.projectName
    );
    const cached = responseCache.get(cacheKey) as AIResponse | null;
    if (cached) {
      logger.info(
        { cacheKey: cacheKey.slice(0, 12) },
        'Cache hit for documentation'
      );
      return cached;
    }

    const prompt = PromptBuilder.generateDocPrompt(params);
    const start = Date.now();
    const result = await this.provider.getResponse(prompt);
    recordAICall(this.providerName, Date.now() - start, !!result.error);

    // Cache successful results
    if (result.text && !result.error) {
      responseCache.set(cacheKey, result);
    }

    return result;
  }

  /**
   * Translate code between programming languages.
   * Results are cached for 1 hour.
   */
  async translateCode(params: {
    sourceCode: string;
    sourceLanguage: string;
    targetLanguage: string;
  }): Promise<AIResponse> {
    const cacheKey = makeCacheKey(
      'translate',
      params.sourceCode,
      params.sourceLanguage,
      params.targetLanguage
    );
    const cached = responseCache.get(cacheKey) as AIResponse | null;
    if (cached) {
      logger.info(
        { cacheKey: cacheKey.slice(0, 12) },
        'Cache hit for translation'
      );
      return cached;
    }

    const prompt = PromptBuilder.generateTranslationPrompt(params);
    const start = Date.now();
    const result = await this.provider.getResponse(prompt);
    recordAICall(this.providerName, Date.now() - start, !!result.error);

    if (result.text && !result.error) {
      responseCache.set(cacheKey, result);
    }

    return result;
  }

  /**
   * Analyze code quality, security, and performance.
   * NOT cached — code reviews should always be fresh.
   */
  async analyzeCode(params: {
    code: string;
    language: string;
    options: {
      quality: boolean;
      security: boolean;
      performance: boolean;
      style: boolean;
      documentation: boolean;
      depth: string;
    };
  }): Promise<AIResponse> {
    const prompt = PromptBuilder.generateCodeReviewPrompt(
      params,
      params.options
    );
    const start = Date.now();
    const response = await this.provider.getResponse(prompt);
    recordAICall(this.providerName, Date.now() - start, !!response.error);

    // If we have a successful text response, try to parse it as JSON
    if (response.text && !response.error) {
      try {
        const jsonMatch = response.text.match(/```json\n([\s\S]*?)\n```/) ||
          response.text.match(/```\n([\s\S]*?)\n```/) || [null, response.text];

        const jsonContent = jsonMatch[1] || response.text;
        JSON.parse(jsonContent);

        return { text: jsonContent };
      } catch (error) {
        logger.warn(
          'Failed to parse AI code review response as JSON, returning raw text'
        );
        return response;
      }
    }

    return response;
  }
}
