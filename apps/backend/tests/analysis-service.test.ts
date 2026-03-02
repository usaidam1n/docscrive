import { AnalysisService } from '../src/services/analysis-service.js';
import { AIServiceFactory } from '../src/factories/ai-service-factory.js';
import * as utils from '../src/lib/utils.js';
import { ValidationError, AIProviderError } from '../src/lib/errors.js';
import type { AnalysisRequest } from '../src/types/index.js';

jest.mock('../src/factories/ai-service-factory.js');
jest.mock('../src/lib/utils.js');

const DEFAULT_OPTIONS: AnalysisRequest['options'] = {
  quality: true,
  security: true,
  performance: true,
  style: true,
  documentation: true,
  depth: 'standard',
};

describe('AnalysisService', () => {
  let analysisService: AnalysisService;
  let mockAIService: any;

  beforeEach(() => {
    analysisService = new AnalysisService();
    mockAIService = {
      analyzeCode: jest.fn(),
    };
    (AIServiceFactory.createCloudAIService as jest.Mock).mockReturnValue(
      mockAIService
    );
    (utils.detectPlatform as jest.Mock).mockReturnValue('github');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should analyze code string successfully', async () => {
    const mockResult = {
      text: JSON.stringify({
        summary: { quality: 80 },
        issues: [],
        suggestions: [],
      }),
    };
    mockAIService.analyzeCode.mockResolvedValue(mockResult);

    const result = await analysisService.analyze({
      sourceType: 'code',
      code: 'const a = 1; const b = 2; const c = 3;',
      language: 'javascript',
      selectedModel: { key: 'openai', value: 'gpt-4' },
      apiKey: 'test-key',
      options: DEFAULT_OPTIONS,
    });

    expect(result.summary.quality).toBe(80);
    expect(mockAIService.analyzeCode).toHaveBeenCalled();
  });

  it('should throw ValidationError if code is too short', async () => {
    await expect(
      analysisService.analyze({
        sourceType: 'code',
        code: 'short',
        language: 'javascript',
        selectedModel: { key: 'openai', value: 'gpt-4' },
        apiKey: 'test-key',
        options: DEFAULT_OPTIONS,
      })
    ).rejects.toThrow(ValidationError);
  });

  it('should throw AIProviderError if AI service fails', async () => {
    mockAIService.analyzeCode.mockResolvedValue({
      error: true,
      message: 'AI Error',
    });

    await expect(
      analysisService.analyze({
        sourceType: 'code',
        code: 'const a = 1; const b = 2; const c = 3;',
        language: 'javascript',
        selectedModel: { key: 'openai', value: 'gpt-4' },
        apiKey: 'test-key',
        options: DEFAULT_OPTIONS,
      })
    ).rejects.toThrow(AIProviderError);
  });
});
