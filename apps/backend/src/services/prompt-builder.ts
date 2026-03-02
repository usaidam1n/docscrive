import { z } from 'zod';
import { codeReviewPrompt, codeTranslationPrompt } from '../lib/prompts.js';

/**
 * Style-specific documentation instructions.
 * Only the selected style is included in the prompt — no wasted tokens.
 */
const STYLE_INSTRUCTIONS: Record<string, string> = {
  comprehensive: `Generate comprehensive documentation with maximum detail:
- Include ALL sections: Quick Start, Architecture, API Docs, Development, Deployment, Monitoring, Troubleshooting, Contributing
- Generate extensive code examples (5-10 per feature)
- Include architecture diagrams using mermaid syntax and sequence flows
- Add performance benchmarks and optimization guides
- Provide troubleshooting for edge cases
- Target length: 5000-10000+ lines`,

  technical: `Generate technical documentation focused on implementation details:
- Include: Architecture, API Reference, Configuration, Development, Performance
- Emphasize API documentation and specifications
- Include performance characteristics and Big-O notation
- Add system requirements and compatibility matrix
- Target length: 3000-5000 lines`,

  'user-guide': `Generate a user-friendly guide:
- Include: Getting Started, Tutorials, Use Cases, FAQ, Support
- Write in accessible, non-technical language where possible
- Focus on practical usage scenarios
- Include step-by-step tutorials
- Add FAQ section with common questions
- Target length: 2000-3000 lines`,

  overview: `Generate a concise overview:
- Include: Overview, Quick Start, Key Features, Basic Examples
- High-level summary focusing on "what" and "why"
- Quick start in under 5 steps
- Key features with business value
- Basic usage examples only
- Target length: 500-1000 lines`,

  'api-reference': `Generate structured API documentation:
- Include: API Overview, Authentication, Endpoints, Errors, Rate Limits, SDKs
- Follow OpenAPI spec structure
- Comprehensive endpoint documentation
- Request/response examples for every endpoint
- Authentication and rate limiting details
- Target length: 2000-4000 lines`,
};

/**
 * Helper functions for intelligent project detection
 */
function detectProjectType(codebase: string): string {
  if (codebase.includes('package.json')) return 'node-application';
  if (codebase.includes('requirements.txt')) return 'python-application';
  if (codebase.includes('Cargo.toml')) return 'rust-application';
  if (codebase.includes('go.mod')) return 'go-application';
  if (codebase.includes('pom.xml')) return 'java-application';
  return 'unknown';
}

function detectPrimaryLanguage(codebase: string): string {
  const extensions: Record<string, string> = {
    '.ts': 'TypeScript',
    '.js': 'JavaScript',
    '.py': 'Python',
    '.java': 'Java',
    '.go': 'Go',
    '.rs': 'Rust',
    '.cpp': 'C++',
    '.cs': 'C#',
    '.rb': 'Ruby',
    '.php': 'PHP',
  };

  const counts: Record<string, number> = {};
  for (const [ext, lang] of Object.entries(extensions)) {
    const regex = new RegExp(`\\${ext}`, 'g');
    const matches = codebase.match(regex);
    if (matches) counts[lang] = matches.length;
  }

  return (
    Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown'
  );
}

function detectFramework(codebase: string): string {
  const frameworks: Record<string, string> = {
    'next.config': 'Next.js',
    'nuxt.config': 'Nuxt.js',
    'angular.json': 'Angular',
    'vue.config': 'Vue.js',
    django: 'Django',
    flask: 'Flask',
    express: 'Express.js',
    fastapi: 'FastAPI',
    spring: 'Spring',
    rails: 'Ruby on Rails',
  };

  for (const [indicator, framework] of Object.entries(frameworks)) {
    if (codebase.includes(indicator)) return framework;
  }
  return 'None detected';
}

function detectLicense(codebase: string): string {
  if (codebase.includes('MIT License')) return 'MIT';
  if (codebase.includes('Apache License')) return 'Apache-2.0';
  if (codebase.includes('GNU General Public')) return 'GPL';
  if (codebase.includes('BSD')) return 'BSD';
  return 'Not specified';
}

function detectVersion(codebase: string): string {
  const versionMatch = codebase.match(/"version":\s*"([^"]+)"/);
  return versionMatch ? versionMatch[1] : '1.0.0';
}

// Validation schemas
const DocRequestSchema = z.object({
  projectName: z.string(),
  projectDescription: z.string(),
  codebase: z.string(),
  configuration: z
    .object({
      style: z
        .enum([
          'comprehensive',
          'overview',
          'technical',
          'user-guide',
          'api-reference',
        ])
        .optional(),
      format: z
        .enum(['markdown', 'html', 'pdf', 'confluence', 'notion'])
        .optional(),
      structure: z.enum(['single-file', 'hierarchical', 'modular']).optional(),
      includeCodeExamples: z.boolean().optional(),
      includeApiDocs: z.boolean().optional(),
      includeArchitecture: z.boolean().optional(),
      includeSetupInstructions: z.boolean().optional(),
      includeTroubleshooting: z.boolean().optional(),
      includeTableOfContents: z.boolean().optional(),
      includeBadges: z.boolean().optional(),
      includeContributingGuide: z.boolean().optional(),
      temperature: z.number().optional(),
      customPrompt: z.string().optional(),
      includePrivateFiles: z.boolean().optional(),
      generateDiagrams: z.boolean().optional(),
    })
    .optional(),
  repository: z
    .object({
      name: z.string(),
      full_name: z.string().optional(),
      description: z.string().nullable().optional(),
      language: z.string().nullable().optional(),
      topics: z.array(z.string()).optional(),
      license: z
        .object({
          name: z.string(),
          spdx_id: z.string().optional(),
        })
        .nullable()
        .optional(),
    })
    .optional(),
  userContext: z
    .object({
      userId: z.string(),
      username: z.string(),
    })
    .optional(),
  repositoryMetadata: z.any().optional(),
});

const TranslationRequestSchema = z.object({
  sourceCode: z.string(),
  sourceLanguage: z.string(),
  targetLanguage: z.string(),
});

const CodeReviewSchema = z.object({
  code: z.string(),
  language: z.string(),
});

export class PromptBuilder {
  /**
   * Generates a documentation prompt.
   * Only includes the instructions for the selected style — no wasted tokens.
   */
  static generateDocPrompt(params: z.infer<typeof DocRequestSchema>): string {
    const validated = DocRequestSchema.parse(params);
    const config = validated.configuration || {};
    const repository = validated.repository;
    const repositoryMetadata = validated.repositoryMetadata;
    const style = config.style || 'comprehensive';

    // Build the system instruction — only the selected style
    const styleInstructions =
      STYLE_INSTRUCTIONS[style] || STYLE_INSTRUCTIONS.comprehensive;

    // Build section toggle list
    const enabledSections: string[] = [];
    if (config.includeCodeExamples !== false)
      enabledSections.push('Code Examples');
    if (config.includeApiDocs !== false)
      enabledSections.push('API Documentation');
    if (config.includeArchitecture !== false)
      enabledSections.push('Architecture Overview');
    if (config.includeSetupInstructions !== false)
      enabledSections.push('Setup Instructions');
    if (config.includeTroubleshooting) enabledSections.push('Troubleshooting');
    if (config.includeTableOfContents !== false)
      enabledSections.push('Table of Contents');
    if (config.includeBadges) enabledSections.push('Status Badges');
    if (config.includeContributingGuide)
      enabledSections.push('Contributing Guide');

    // Build repository context
    const repoContext = [
      `Repository: ${repository?.full_name || validated.projectName}`,
      `Project Type: ${detectProjectType(validated.codebase)}`,
      `Primary Language: ${repository?.language || detectPrimaryLanguage(validated.codebase)}`,
      `Framework: ${detectFramework(validated.codebase)}`,
      `License: ${repository?.license?.name || detectLicense(validated.codebase)}`,
      `Version: ${detectVersion(validated.codebase)}`,
      repositoryMetadata?.processedFiles
        ? `Files Processed: ${repositoryMetadata.processedFiles}/${repositoryMetadata.totalFiles || '?'}`
        : null,
    ]
      .filter(Boolean)
      .join('\n');

    const formatInstruction =
      config.format === 'pdf'
        ? 'plain text (without markdown formatting)'
        : config.format || 'markdown';

    const isSnippet = validated.codebase.split('\n').length < 50;
    const snippetInstruction = isSnippet
      ? '\n\n### CRITICAL: SHORT SNIPPET DETECTED\nThe provided code is a very short snippet. You MUST keep the documentation extremely concise and proportional to the input size. DO NOT generate comprehensive project-level documentation, architecture, or boilerplate sections. Focus ONLY on explaining the few lines of code provided.'
      : '';

    const prompt = `You are a technical documentation expert. Your job is to produce accurate, useful, developer-ready documentation.

## Task
Generate ${style} documentation in ${formatInstruction} format for the project described below.${snippetInstruction}

## Style Instructions
${styleInstructions}

## Enabled Sections
${enabledSections.join(', ')}

## Repository Context
${repoContext}

${validated.projectDescription ? `## Project Description\n${validated.projectDescription}` : ''}

${config.customPrompt ? `## Additional Requirements\n${config.customPrompt}` : ''}

## Codebase
${validated.codebase}

## Quality Criteria (follow strictly)

### Process — Think Before Writing
1. First, silently analyze the codebase: identify entry points, core modules, dependencies, config files, and public APIs.
2. Then, write the documentation grounded in what you actually found — not what you assume.

### Accuracy Rules
- Every code example MUST come from or directly reference the actual codebase above. Never invent functions, classes, or APIs that don't exist in the codebase.
- Every file path, command, and configuration value MUST be verified against the codebase.
- If something is unclear from the codebase, say "based on the codebase structure" rather than stating it as fact.

### What NOT To Do
- Do NOT use placeholder text like "[your-value-here]", "TODO", or "TBD". If you don't know, omit the section.
- Do NOT include generic descriptions that could apply to any project. Be specific to THIS codebase.
- Do NOT add marketing language, promotional tone, or subjective quality claims ("blazingly fast", "world-class").
- Do NOT fabricate package versions, configuration options, or API endpoints.

### Formatting
- Use proper markdown with clear heading hierarchy (h1 → h2 → h3).
- Use fenced code blocks with language identifiers.
- Keep paragraphs concise — prefer bullet points for lists of features or steps.
- Include a table of contents if the document exceeds 200 lines.`;

    return prompt;
  }

  /**
   * Generates a code translation prompt
   */
  static generateTranslationPrompt(
    params: z.infer<typeof TranslationRequestSchema>
  ): string {
    const validated = TranslationRequestSchema.parse(params);
    return codeTranslationPrompt
      .replace('[source language]', validated.sourceLanguage)
      .replace('[target language]', validated.targetLanguage)
      .concat(`\n\nSource Code:\n${validated.sourceCode}`);
  }

  /**
   * Generates an enhanced code review prompt
   */
  static generateCodeReviewPrompt(
    params: z.infer<typeof CodeReviewSchema>,
    options: {
      quality: boolean;
      security: boolean;
      performance: boolean;
      style: boolean;
      documentation: boolean;
      depth: string;
    }
  ): string {
    const validated = CodeReviewSchema.parse(params);

    // Build focus areas
    const focusAreas = [];
    if (options.quality) focusAreas.push('Code Quality and Maintainability');
    if (options.security)
      focusAreas.push('Security Vulnerabilities and Best Practices');
    if (options.performance)
      focusAreas.push('Performance Optimization and Scalability');
    if (options.style) focusAreas.push('Code Style and Best Practices');
    if (options.documentation)
      focusAreas.push('Documentation and Code Clarity');

    const analysisFocus =
      focusAreas.length > 0 ? focusAreas.join(', ') : 'Comprehensive Analysis';

    // Determine estimated scale based on code complexity
    const linesOfCode = validated.code.split('\n').length;
    const estimatedScale =
      linesOfCode > 1000 ? 'high' : linesOfCode > 500 ? 'medium' : 'low';

    return codeReviewPrompt
      .replace(/\[language\]/g, validated.language)
      .replace(/\[analysis_focus\]/g, analysisFocus)
      .replace(/\[depth\]/g, options.depth)
      .replace(/\[estimated_scale\]/g, estimatedScale)
      .replace(/\[code\]/g, validated.code);
  }
}
