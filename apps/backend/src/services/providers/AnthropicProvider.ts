import { Anthropic } from '@anthropic-ai/sdk';
import { IAIProvider } from './IAIProvider.js';
import { AIResponse } from '../ai-service-provider.js';
import { z } from 'zod';
import logger from '../../lib/logger.js';
import { withRetry } from '../../lib/retry.js';

const AnthropicConfigSchema = z.object({
  apiKey: z.string(),
  model: z.string(),
  temperature: z.number().min(0).max(2).default(0.2),
  maxTokens: z.number().default(16384),
});

export class AnthropicProvider implements IAIProvider {
  private anthropic: Anthropic;
  private config: z.infer<typeof AnthropicConfigSchema>;

  constructor(config: any) {
    this.config = AnthropicConfigSchema.parse(config);
    this.anthropic = new Anthropic({ apiKey: this.config.apiKey });
  }

  async getResponse(prompt: string): Promise<AIResponse> {
    try {
      const msg = await withRetry(
        () =>
          this.anthropic.messages.create(
            {
              model: this.config.model,
              max_tokens: this.config.maxTokens,
              messages: [{ role: 'user', content: prompt }],
            },
            {
              timeout: 120_000, // 2-minute timeout per attempt
            }
          ),
        `Anthropic/${this.config.model}`
      );

      if (msg?.content && Array.isArray(msg.content)) {
        if ('text' in msg.content[0]) {
          return { text: msg.content[0].text };
        } else {
          throw new Error('Invalid response format from Anthropic');
        }
      }
      throw new Error('Invalid response format from Anthropic');
    } catch (error: any) {
      logger.error(
        {
          provider: 'anthropic',
          model: this.config.model,
          error: error.message,
        },
        'Error in Anthropic provider'
      );
      return {
        error: true,
        message: 'Failed to get response from Anthropic API',
        details: error.message || error,
      };
    }
  }
}
