import { AIServiceFactory } from '../factories/ai-service-factory.js';
import { fetchCodeFromPullRequest, detectPlatform } from '../lib/utils.js';
import {
  ValidationError,
  AIProviderError,
  AnalysisError,
} from '../lib/errors.js';
import type {
  AnalysisRequest,
  AnalysisResult,
  AnalysisIssue,
  AnalysisSuggestion,
} from '../types/index.js';
import type { AIResponse } from './ai-service-provider.js';

export class AnalysisService {
  async analyze(data: AnalysisRequest): Promise<AnalysisResult> {
    let codeContent = '';

    // Handle different source types
    if (data.sourceType === 'pullrequest' && data.pullRequestUrl) {
      try {
        const apiToken = process.env.GIT_API_TOKEN || undefined;
        codeContent = await fetchCodeFromPullRequest(
          data.pullRequestUrl,
          apiToken
        );

        if (!codeContent || codeContent.trim().length < 10) {
          throw new ValidationError(
            'Failed to extract meaningful code changes from pull request'
          );
        }
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Unknown error';
        throw new ValidationError(`Failed to fetch pull request: ${message}`);
      }
    } else if (data.sourceType === 'code' && data.code) {
      codeContent = data.code;
    } else {
      throw new ValidationError(
        'Invalid request: Either pull request URL or code must be provided'
      );
    }

    if (!codeContent || codeContent.trim().length < 10) {
      throw new ValidationError('Code content too short to analyze');
    }

    if (!data.selectedModel || !data.apiKey) {
      throw new ValidationError(
        'Missing required fields: apiKey and selectedModel'
      );
    }

    let aiService;
    try {
      aiService = AIServiceFactory.createCloudAIService(
        data.selectedModel,
        data.apiKey
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new AIProviderError(`Failed to create AI service: ${message}`);
    }

    const result = await aiService.analyzeCode({
      code: codeContent,
      language: data.language,
      options: data.options,
    });

    if (result.error) {
      throw new AIProviderError(
        result.message || 'AI code analysis failed',
        result.details
      );
    }

    return this.standardizeResult(result, codeContent, data);
  }

  private standardizeResult(
    result: AIResponse,
    codeContent: string,
    data: AnalysisRequest
  ): AnalysisResult {
    let jsonContent = result.text || '{}';

    if (typeof jsonContent === 'string') {
      const jsonRegex = /(\{[\s\S]*\})/;
      const jsonMatch = jsonContent.match(jsonRegex);

      if (jsonMatch) {
        jsonContent = jsonMatch[0];
      }

      jsonContent = jsonContent
        .replace(/```json\n/g, '')
        .replace(/```\n/g, '')
        .replace(/```/g, '');
    }

    let analysisResults: Record<string, any>;
    try {
      analysisResults = JSON.parse(jsonContent);
    } catch {
      throw new AnalysisError('Failed to parse analysis results JSON', {
        raw: jsonContent,
      });
    }

    const issues: AnalysisIssue[] = Array.isArray(analysisResults.issues)
      ? analysisResults.issues.map(
          (issue: Record<string, any>, index: number) => ({
            id: issue.id || `ISSUE-${index + 1}`,
            severity: issue.severity || 'medium',
            type: issue.type || 'quality',
            message: issue.message || 'Issue detected',
            line: issue.line || 0,
            column: issue.column || 0,
            snippet: issue.snippet || 'Code snippet not available',
            suggestion: issue.suggestion || 'No specific suggestion available',
            fixExample: issue.fixExample || 'Fix example not available',
          })
        )
      : [];

    const suggestions: AnalysisSuggestion[] = Array.isArray(
      analysisResults.suggestions
    )
      ? analysisResults.suggestions.map(
          (suggestion: Record<string, any>, index: number) => ({
            id: suggestion.id || `SUG-${index + 1}`,
            title: suggestion.title || 'Improvement suggestion',
            description:
              suggestion.description || 'No detailed description available',
            priority: suggestion.priority || 'medium',
          })
        )
      : [];

    const standardizedResponse: AnalysisResult = {
      summary: {
        issuesCount: {
          critical: analysisResults.summary?.issuesCount?.critical || 0,
          high: analysisResults.summary?.issuesCount?.high || 0,
          medium: analysisResults.summary?.issuesCount?.medium || 0,
          low: analysisResults.summary?.issuesCount?.low || 0,
        },
        quality: analysisResults.summary?.quality || 50,
        complexity: analysisResults.summary?.complexity || 0,
        securityScore: analysisResults.summary?.securityScore || 50,
      },
      issues,
      metrics: {
        linesOfCode:
          analysisResults.metrics?.linesOfCode ||
          codeContent.split('\n').length,
        cyclomaticComplexity:
          analysisResults.metrics?.cyclomaticComplexity || 0,
        maintainabilityIndex:
          analysisResults.metrics?.maintainabilityIndex || 0,
        codeSmells: analysisResults.metrics?.codeSmells || 0,
        duplications: analysisResults.metrics?.duplications || 0,
      },
      suggestions,
      sourceType: data.sourceType,
      sourceInfo:
        data.sourceType === 'pullrequest' && data.pullRequestUrl
          ? {
              url: data.pullRequestUrl,
              platform: detectPlatform(data.pullRequestUrl),
            }
          : undefined,
    };

    // Capture any additional comments from the AI outside the JSON
    if (
      typeof result.text === 'string' &&
      result.text.length > jsonContent.length
    ) {
      const remainingText = result.text.replace(jsonContent, '').trim();
      if (remainingText) {
        standardizedResponse.additionalComments = remainingText;
      }
    }

    return standardizedResponse;
  }
}
