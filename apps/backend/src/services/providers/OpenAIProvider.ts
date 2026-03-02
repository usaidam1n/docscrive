import OpenAI from 'openai';
import { IAIProvider } from './IAIProvider.js';
import { AIResponse } from '../ai-service-provider.js';
import { z } from 'zod';
import logger from '../../lib/logger.js';
import { withRetry } from '../../lib/retry.js';

const OpenAIConfigSchema = z.object({
  apiKey: z.string(),
  model: z.string(),
  temperature: z.number().min(0).max(2).default(0.2),
  maxTokens: z.number().optional(),
});

// Models that don't support the temperature parameter
const REASONING_MODELS = ['o1', 'o1-mini', 'o1-preview', 'o3', 'o3-mini'];

export class OpenAIProvider implements IAIProvider {
  private openai: OpenAI;
  private config: z.infer<typeof OpenAIConfigSchema>;

  constructor(config: any) {
    this.config = OpenAIConfigSchema.parse(config);
    this.openai = new OpenAI({ apiKey: this.config.apiKey });
  }

  private isReasoningModel(): boolean {
    return REASONING_MODELS.some(m => this.config.model.startsWith(m));
  }

  async getResponse(prompt: string): Promise<AIResponse> {
    try {
      const isReasoning = this.isReasoningModel();

      const params: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming = {
        model: this.config.model,
        messages: [{ role: 'user', content: prompt }],
        // Reasoning models don't support temperature
        ...(isReasoning ? {} : { temperature: this.config.temperature }),
        // Set max_tokens for non-reasoning models
        ...(this.config.maxTokens && !isReasoning
          ? { max_tokens: this.config.maxTokens }
          : {}),
        // Reasoning models use max_completion_tokens instead
        ...(this.config.maxTokens && isReasoning
          ? { max_completion_tokens: this.config.maxTokens }
          : {}),
      };

      const response = await withRetry(
        () =>
          this.openai.chat.completions.create(params, {
            timeout: 120_000, // 2-minute timeout per attempt
          }),
        `OpenAI/${this.config.model}`
      );

      return { text: response?.choices[0]?.message?.content?.trim() };
    } catch (error: any) {
      logger.error(
        { provider: 'openai', model: this.config.model, error: error.message },
        'Error in OpenAI provider'
      );
      return {
        error: true,
        message: 'Failed to get response from OpenAI API',
        details: error.message || error,
      };
    }
  }
}
