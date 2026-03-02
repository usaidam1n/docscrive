import { GoogleGenerativeAI } from '@google/generative-ai';
import { IAIProvider } from './IAIProvider.js';
import { AIResponse } from '../ai-service-provider.js';
import { z } from 'zod';
import logger from '../../lib/logger.js';
import { withRetry } from '../../lib/retry.js';

const GoogleConfigSchema = z.object({
  apiKey: z.string(),
  model: z.string(),
  temperature: z.number().min(0).max(2).default(0.2),
  topP: z.number().min(0).max(1).default(0.1),
  topK: z.number().default(16),
});

export class GoogleProvider implements IAIProvider {
  private google: GoogleGenerativeAI;
  private config: z.infer<typeof GoogleConfigSchema>;

  constructor(config: any) {
    this.config = GoogleConfigSchema.parse(config);
    this.google = new GoogleGenerativeAI(this.config.apiKey);
  }

  async getResponse(prompt: string): Promise<AIResponse> {
    try {
      const generationConfig = {
        temperature: this.config.temperature,
        topP: this.config.topP,
        topK: this.config.topK,
      };

      const model = this.google.getGenerativeModel({
        model: this.config.model,
        generationConfig,
      });

      const result = await withRetry(
        () => model.generateContent(prompt),
        `Google/${this.config.model}`
      );

      const response = await result.response;
      return { text: response.text() };
    } catch (error: any) {
      logger.error(
        { provider: 'google', model: this.config.model, error: error.message },
        'Error in Google provider'
      );
      return {
        error: true,
        message: 'Failed to get response from Google API',
        details: error.message || error,
      };
    }
  }
}
