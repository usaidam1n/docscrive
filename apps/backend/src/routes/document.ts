import { Router, Request, Response } from 'express';
import { z } from 'zod';
import {
  DocumentRequestSchema,
  getDefaultConfiguration,
  handleError,
  estimateTokenCount,
} from '../lib/utils.js';
import { fetchCodeFromGitHubUrl } from '../services/github-repository-fetcher.js';
import { AIServiceFactory } from '../factories/ai-service-factory.js';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  req.log.info(
    {
      hasUrl: !!req.body.url,
      hasGithubUrl: !!req.body.githubUrl,
      hasTextCode: !!req.body.textCode,
      model: req.body.selectedModel?.key,
    },
    'POST /api/generate-document - Received request'
  );

  try {
    const data = DocumentRequestSchema.parse(req.body);
    req.log.info('Parsing document input successful');

    // Get user's GitHub token from the request (sent by Next.js proxy)
    const userGitHubToken = data.githubToken;
    const userContext = data.userContext;

    req.log.info(
      {
        userId: userContext?.userId,
        username: userContext?.username,
      },
      "Processing request with user's GitHub token"
    );

    const repository = data.repository;
    const baseConfig = getDefaultConfiguration();
    const userConfig = data.configuration || {};
    // Merge and validate configuration with enhanced validation
    const config = {
      ...baseConfig,
      ...userConfig,
      // Ensure required fields are properly set
      aiModel: data.selectedModel?.value || baseConfig.aiModel,
      temperature:
        typeof (userConfig as any).temperature === 'number'
          ? Math.max(0, Math.min(2, (userConfig as any).temperature))
          : baseConfig.temperature,
      maxTokensPerFile:
        typeof (userConfig as any).maxTokensPerFile === 'number'
          ? Math.max(
              1000,
              Math.min(100000, (userConfig as any).maxTokensPerFile)
            )
          : baseConfig.maxTokensPerFile,
      maxTotalFiles:
        typeof (userConfig as any).maxTotalFiles === 'number'
          ? Math.max(1, Math.min(1000, (userConfig as any).maxTotalFiles))
          : baseConfig.maxTotalFiles,
      batchSize:
        typeof (userConfig as any).batchSize === 'number'
          ? Math.max(1, Math.min(50, (userConfig as any).batchSize))
          : baseConfig.batchSize,
      concurrency:
        typeof (userConfig as any).concurrency === 'number'
          ? Math.max(1, Math.min(10, (userConfig as any).concurrency))
          : baseConfig.concurrency,
    };

    // Log configuration for debugging
    req.log.info(
      {
        style: config.style,
        format: config.format,
        structure: config.structure,
        aiModel: config.aiModel,
        temperature: config.temperature,
        maxTotalFiles: config.maxTotalFiles,
        includeCodeExamples: config.includeCodeExamples,
        includeApiDocs: config.includeApiDocs,
        includeArchitecture: config.includeArchitecture,
      },
      'Using configuration'
    );

    let codeContent = '';
    let repositoryMetadata: any = null;

    if (data.githubUrl) {
      req.log.info(
        {
          url: data.githubUrl,
          repository: repository?.full_name,
          user: userContext?.username,
        },
        'Fetching repository content'
      );

      try {
        // Use user's GitHub token to fetch their repository
        const repositoryContent = await fetchCodeFromGitHubUrl(
          data.githubUrl,
          {
            includePatterns: config.includePatterns,
            excludePatterns: config.excludePatterns,
            maxFileSize: config.maxFileSize,
            maxTotalFiles: config.maxTotalFiles,
            includePrivateFiles: config.includePrivateFiles,
          },
          userGitHubToken, // ← User's token from session
          req.log
        );

        // Validate that we got meaningful content
        if (
          !repositoryContent ||
          !repositoryContent.files ||
          repositoryContent.files.length === 0
        ) {
          return res.status(400).json({
            error: 'No processable files found in repository',
            message:
              'The repository contains no files matching the specified patterns or all files exceed size limits.',
            suggestions: [
              'Check include/exclude patterns',
              'Increase maxFileSize limit',
              'Ensure repository has supported file types',
            ],
          });
        }

        // Check if we have enough content for meaningful documentation
        const totalContentLength = repositoryContent.files.reduce(
          (acc, file) => acc + file.content.length,
          0
        );
        if (totalContentLength < 100) {
          req.log.warn(
            {
              totalFiles: repositoryContent.files.length,
              totalContentLength,
            },
            'Very little content found for documentation'
          );
        }
        // Process the content...
        // Smart Context Management
        const MAX_CONTEXT_TOKENS = 120000; // Reserve space for prompt and response
        let currentTokens = 0;
        const processedFiles: string[] = [];
        const skippedFiles: string[] = [];
        const truncatedFiles: string[] = [];

        // Prioritize files
        const priorityPatterns = [
          /readme\.md$/i,
          /package\.json$/,
          /tsconfig\.json$/,
          /index\.(ts|js|tsx|jsx)$/,
          /main\.(ts|js|go|py)$/,
          /app\.(ts|js|py)$/,
          /server\.(ts|js)$/,
          /api\//,
          /routes\//,
          /models\//,
          /types\//,
          /interfaces\//,
        ];

        const getFilePriority = (path: string): number => {
          for (let i = 0; i < priorityPatterns.length; i++) {
            if (priorityPatterns[i].test(path)) return i;
          }
          return 999;
        };

        const sortedFiles = [...repositoryContent.files].sort((a, b) => {
          const priorityA = getFilePriority(a.path);
          const priorityB = getFilePriority(b.path);
          if (priorityA !== priorityB) return priorityA - priorityB;
          return a.path.localeCompare(b.path);
        });

        codeContent = sortedFiles
          .map(file => {
            if (currentTokens >= MAX_CONTEXT_TOKENS) {
              skippedFiles.push(file.path);
              return null;
            }

            const header = `// File: ${file.path}\n`;
            const headerTokens = estimateTokenCount(header);
            const contentTokens = estimateTokenCount(file.content);

            if (
              currentTokens + headerTokens + contentTokens >
              MAX_CONTEXT_TOKENS
            ) {
              // Truncate file
              const remainingTokens =
                MAX_CONTEXT_TOKENS - currentTokens - headerTokens;
              if (remainingTokens < 100) {
                skippedFiles.push(file.path);
                return null;
              }

              const truncatedContent = file.content.slice(
                0,
                remainingTokens * 4
              ); // Approx chars
              truncatedFiles.push(file.path);
              currentTokens +=
                headerTokens + estimateTokenCount(truncatedContent);
              return `${header}${truncatedContent}\n// ... content truncated due to context limits ...`;
            }

            currentTokens += headerTokens + contentTokens;
            processedFiles.push(file.path);
            return `${header}${file.content}`;
          })
          .filter(Boolean)
          .join('\n\n');

        if (skippedFiles.length > 0) {
          req.log.warn(
            {
              count: skippedFiles.length,
              examples: skippedFiles.slice(0, 5),
            },
            'Smart Context: Skipped files due to token limit'
          );
        }

        if (truncatedFiles.length > 0) {
          req.log.warn(
            {
              count: truncatedFiles.length,
              examples: truncatedFiles.slice(0, 5),
            },
            'Smart Context: Truncated files'
          );
        }

        repositoryMetadata = {
          ...repositoryContent.metadata,
          totalSize: repositoryContent.totalSize,
          processedFiles: processedFiles.length,
          skippedFiles: [
            ...(repositoryContent.skippedFiles || []),
            ...skippedFiles.map(f => ({
              path: f,
              reason: 'Token limit exceeded',
            })),
          ],
          truncatedFiles: truncatedFiles,
          tokenUsage: currentTokens,
          accessedBy: userContext?.username,
        };

        req.log.info(
          {
            repository: repositoryContent.metadata.repository,
            user: userContext?.username,
            processedFiles: repositoryContent.files.length,
          },
          'Repository content fetched successfully'
        );
      } catch (githubError) {
        req.log.error(
          {
            error:
              githubError instanceof Error
                ? githubError.message
                : String(githubError),
            user: userContext?.username,
          },
          'Failed to fetch repository content'
        );

        return res.status(400).json({
          error: 'Failed to fetch repository content',
          details:
            githubError instanceof Error
              ? githubError.message
              : String(githubError),
        });
      }
    } else if (data.textCode) {
      req.log.info(
        {
          user: userContext?.username,
          contentLength: data.textCode.length,
        },
        'Processing provided text code'
      );

      const MAX_CONTEXT_TOKENS = 120000;
      let textContent = data.textCode;
      let tokens = estimateTokenCount(textContent);
      const truncatedFiles: string[] = [];

      if (tokens > MAX_CONTEXT_TOKENS) {
        req.log.warn('Provided text code exceeds context limit, truncating');
        textContent = textContent.slice(0, MAX_CONTEXT_TOKENS * 4); // Approx chars
        tokens = estimateTokenCount(textContent);
        textContent += '\n// ... content truncated due to context limits ...';
        truncatedFiles.push('Provided Code');
      }

      codeContent = `// Provided Code\n${textContent}`;

      repositoryMetadata = {
        repository: 'Provided Code',
        totalSize: textContent.length,
        totalFiles: 1,
        processedFiles: 1,
        skippedFiles: [],
        truncatedFiles,
        tokenUsage: tokens,
        accessedBy: userContext?.username,
      };
    }

    // Create AI service
    if (!data.selectedModel || !data.apiKey) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Both selectedModel and apiKey are required',
      });
    }
    const aiService = AIServiceFactory.createCloudAIService(
      data.selectedModel,
      data.apiKey
    );

    const enhancedParams = {
      projectName: repository?.name || 'Provided Project',
      projectDescription:
        repository?.description || 'Project from provided code',
      codebase: codeContent,
      configuration: config,
      repository: repository,
      userContext: userContext,
      repositoryMetadata: repositoryMetadata,
    };

    req.log.info(
      {
        projectName: enhancedParams.projectName,
        provider: data.selectedModel.key,
        model: data.selectedModel.value,
      },
      'Generating documentation with AI service'
    );

    const result = await aiService.generateDocumentation(enhancedParams);

    if (result.error) {
      return res.status(500).json({
        message: result.message,
        details: result.details,
      });
    }

    // Enhanced response with comprehensive metadata
    const responseMetadata = {
      generatedAt: new Date().toISOString(),
      repository: repository,
      configuration: {
        ...config,
        // Sanitize sensitive configuration data
        customPrompt: config.customPrompt
          ? '[Custom prompt provided]'
          : undefined,
      },
      processing: {
        ...repositoryMetadata,
        requestId: req.headers['x-request-id'] || 'unknown',
        processingTime:
          Date.now() -
          new Date(
            (req.headers['x-timestamp'] as string) || Date.now()
          ).getTime(),
      },
      generatedBy: userContext?.username,
      quality: {
        estimatedCompleteness: result.text
          ? Math.min((result.text.length / 5000) * 100, 100)
          : 0,
        hasCodeExamples: result.text ? result.text.includes('```') : false,
        hasArchitecture: result.text
          ? /architecture|design|component/i.test(result.text)
          : false,
        hasApiDocs: result.text
          ? /api|endpoint|request|response/i.test(result.text)
          : false,
        sections: result.text ? (result.text.match(/^#+\s/gm) || []).length : 0,
      },
      warnings: [] as string[],
    };

    // Add quality warnings
    if (responseMetadata.quality.estimatedCompleteness < 50) {
      responseMetadata.warnings.push(
        'Documentation may be incomplete due to limited content generation'
      );
    }
    if (config.maxTotalFiles < (repositoryMetadata?.totalFiles || 0)) {
      responseMetadata.warnings.push(
        `Only ${config.maxTotalFiles} out of ${
          repositoryMetadata?.totalFiles || 'unknown'
        } files were processed`
      );
    }
    if ((repositoryMetadata?.skippedFiles?.length || 0) > 0) {
      responseMetadata.warnings.push(
        `${
          repositoryMetadata?.skippedFiles?.length || 0
        } files were skipped due to size or filtering constraints`
      );
    }

    req.log.info(
      {
        repository: repository?.full_name,
        user: userContext?.username,
        contentLength: result.text?.length,
        processingTime: responseMetadata.processing.processingTime,
        tokenUsage: responseMetadata.processing.tokenUsage,
        quality: responseMetadata.quality,
        warnings: responseMetadata.warnings.length,
      },
      'Documentation generated successfully'
    );

    const isPdf = data.configuration?.format === 'pdf';
    const responsePayload: any = {
      metadata: responseMetadata,
    };

    if (isPdf) {
      responsePayload.text = result.text;
      responsePayload.isPdf = true;
    } else {
      responsePayload.document = result.text;
    }

    return res.json(responsePayload);
  } catch (error) {
    req.log.error({ error }, 'Unhandled error in /generate-document');
    handleError(res, error);
  }
});

export default router;
