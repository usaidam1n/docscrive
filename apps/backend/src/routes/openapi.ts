import { Router, Request, Response } from 'express';

const router = Router();

/**
 * OpenAPI 3.0 specification for the docscrive API.
 * Served as JSON at GET /api/docs.
 */
const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Docscrive API',
    version: '1.0.0',
    description:
      'AI-powered code documentation, translation, and analysis service. Supports OpenAI, Anthropic, and Google AI providers.',
    contact: {
      name: 'Docscrive',
      url: 'https://docscrive.com',
    },
  },
  servers: [
    { url: 'https://api.docscrive.com', description: 'Production' },
    { url: 'http://localhost:3003', description: 'Local development' },
  ],
  paths: {
    '/api/generate-document': {
      post: {
        summary: 'Generate documentation',
        description:
          'Generates comprehensive documentation for a codebase using AI. Supports GitHub repository URLs or inline code.',
        tags: ['Documentation'],
        security: [{ hmacAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/DocumentRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Documentation generated successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DocumentResponse' },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '429': { $ref: '#/components/responses/RateLimited' },
          '500': { $ref: '#/components/responses/ServerError' },
        },
      },
    },
    '/api/translate-code': {
      post: {
        summary: 'Translate code between languages',
        description:
          'Translates source code from one programming language to another using AI, preserving functional equivalence.',
        tags: ['Translation'],
        security: [{ hmacAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/TranslationRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Code translated successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TranslationResponse' },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '429': { $ref: '#/components/responses/RateLimited' },
          '500': { $ref: '#/components/responses/ServerError' },
        },
      },
    },
    '/api/analyze-code': {
      post: {
        summary: 'Analyze code quality',
        description:
          'Performs AI-powered code review analyzing security, performance, quality, style, and documentation.',
        tags: ['Analysis'],
        security: [{ hmacAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AnalysisRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Code analysis completed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AnalysisResponse' },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '429': { $ref: '#/components/responses/RateLimited' },
          '500': { $ref: '#/components/responses/ServerError' },
        },
      },
    },
    '/health': {
      get: {
        summary: 'Liveness probe',
        tags: ['Health'],
        responses: {
          '200': { description: 'Service is alive' },
        },
      },
    },
    '/health/ready': {
      get: {
        summary: 'Readiness probe',
        tags: ['Health'],
        responses: {
          '200': { description: 'Service is ready to accept requests' },
          '503': { description: 'Service is not ready' },
        },
      },
    },
    '/metrics': {
      get: {
        summary: 'Service metrics',
        tags: ['Observability'],
        responses: {
          '200': { description: 'Current metrics' },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      hmacAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'x-signature',
        description:
          'HMAC-SHA256 signature. Requires x-timestamp, x-nonce, and x-signature headers. Signature = HMAC-SHA256(API_SECRET, JSON.stringify({ timestamp, nonce, body }))',
      },
    },
    schemas: {
      SelectedModel: {
        type: 'object',
        required: ['key', 'value'],
        properties: {
          key: {
            type: 'string',
            enum: ['openai', 'google', 'anthropic'],
            description: 'AI provider',
          },
          value: {
            type: 'string',
            description:
              'Model identifier (e.g. gpt-4, claude-3-opus, gemini-pro)',
          },
        },
      },
      DocumentRequest: {
        type: 'object',
        required: ['selectedModel', 'apiKey'],
        properties: {
          githubUrl: { type: 'string', description: 'GitHub repository URL' },
          textCode: { type: 'string', description: 'Inline code to document' },
          selectedModel: { $ref: '#/components/schemas/SelectedModel' },
          apiKey: {
            type: 'string',
            description: 'API key for the selected AI provider',
          },
          githubToken: {
            type: 'string',
            description: 'GitHub personal access token',
          },
          repository: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              full_name: { type: 'string' },
              description: { type: 'string', nullable: true },
              language: { type: 'string', nullable: true },
            },
          },
          configuration: {
            type: 'object',
            properties: {
              style: {
                type: 'string',
                enum: [
                  'comprehensive',
                  'technical',
                  'user-guide',
                  'overview',
                  'api-reference',
                ],
                default: 'comprehensive',
              },
              format: {
                type: 'string',
                enum: ['markdown', 'html'],
                default: 'markdown',
              },
              includeCodeExamples: { type: 'boolean', default: true },
              includeApiDocs: { type: 'boolean', default: true },
              includeArchitecture: { type: 'boolean', default: true },
              customPrompt: { type: 'string' },
            },
          },
        },
      },
      DocumentResponse: {
        type: 'object',
        properties: {
          document: {
            type: 'string',
            description: 'Generated markdown documentation',
          },
          metadata: {
            type: 'object',
            properties: {
              generatedAt: { type: 'string', format: 'date-time' },
              processing: {
                type: 'object',
                properties: {
                  processedFiles: { type: 'number' },
                  tokenUsage: { type: 'number' },
                },
              },
            },
          },
        },
      },
      TranslationRequest: {
        type: 'object',
        required: ['code', 'language', 'selectedModel', 'apiKey'],
        properties: {
          code: { type: 'string', description: 'Source code to translate' },
          language: {
            type: 'string',
            description: 'Target programming language',
          },
          selectedModel: { $ref: '#/components/schemas/SelectedModel' },
          apiKey: { type: 'string' },
        },
      },
      TranslationResponse: {
        type: 'object',
        properties: {
          document: {
            type: 'string',
            description: 'Translated code with annotations',
          },
        },
      },
      AnalysisRequest: {
        type: 'object',
        required: ['code', 'language', 'selectedModel', 'apiKey'],
        properties: {
          code: { type: 'string', description: 'Code to analyze' },
          language: { type: 'string', description: 'Programming language' },
          sourceType: {
            type: 'string',
            enum: ['code', 'url'],
            default: 'code',
          },
          selectedModel: { $ref: '#/components/schemas/SelectedModel' },
          apiKey: { type: 'string' },
          options: {
            type: 'object',
            properties: {
              quality: { type: 'boolean', default: true },
              security: { type: 'boolean', default: true },
              performance: { type: 'boolean', default: true },
              style: { type: 'boolean', default: true },
              documentation: { type: 'boolean', default: true },
              depth: {
                type: 'string',
                enum: ['quick', 'standard', 'deep'],
                default: 'standard',
              },
            },
          },
        },
      },
      AnalysisResponse: {
        type: 'object',
        properties: {
          summary: {
            type: 'object',
            properties: {
              quality: { type: 'number' },
              issuesCount: { type: 'object' },
            },
          },
          issues: { type: 'array', items: { type: 'object' } },
          suggestions: { type: 'array', items: { type: 'object' } },
          metrics: { type: 'object' },
        },
      },
    },
    responses: {
      BadRequest: {
        description: 'Invalid request — missing fields or validation failure',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
        },
      },
      Forbidden: {
        description: 'Invalid origin, expired timestamp, or bad HMAC signature',
      },
      RateLimited: {
        description:
          'Rate limit exceeded (100 req/15min general, 20 req/15min for AI endpoints)',
        headers: {
          'RateLimit-Limit': { schema: { type: 'integer' } },
          'RateLimit-Remaining': { schema: { type: 'integer' } },
          'RateLimit-Reset': { schema: { type: 'integer' } },
        },
      },
      ServerError: {
        description: 'AI provider error or internal server error',
      },
    },
  },
};

router.get('/', (_req: Request, res: Response) => {
  res.json(openApiSpec);
});

export default router;
