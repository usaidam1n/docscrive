import { AIResponse } from '../ai-service-provider.js';

export interface IAIProvider {
  getResponse(prompt: string): Promise<AIResponse>;
}
