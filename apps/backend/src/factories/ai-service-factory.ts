import { z } from 'zod';
import { AIService } from '../services/ai-service-provider.js';
import { ModelSchema } from '../lib/utils.js';

export class AIServiceFactory {
  static createCloudAIService(
    modelConfig: z.infer<typeof ModelSchema>,
    apiKey: string
  ): AIService {
    const baseConfigs = {
      openai: {
        apiKey,
        temperature: 0.3,
        maxTokens: 16384,
      },
      google: {
        apiKey,
        temperature: 0.2,
        topP: 0.1,
        topK: 16,
      },
      anthropic: {
        apiKey,
        temperature: 0.2,
        maxTokens: 16384,
      },
    };

    const config = {
      ...baseConfigs[modelConfig.key as keyof typeof baseConfigs],
      model: modelConfig.value,
    };
    return new AIService(modelConfig.key, config);
  }
}
