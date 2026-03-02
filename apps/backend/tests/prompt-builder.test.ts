import { PromptBuilder } from '../src/services/prompt-builder';

describe('PromptBuilder', () => {
  describe('generateDocPrompt', () => {
    const baseParams = {
      projectName: 'test-project',
      projectDescription: 'A test project',
      codebase: "// File: index.ts\nconsole.log('hello');",
    };

    it('should generate a prompt with comprehensive style by default', () => {
      const prompt = PromptBuilder.generateDocPrompt(baseParams);
      expect(prompt).toContain('comprehensive');
      expect(prompt).toContain('test-project');
      expect(prompt).toContain('A test project');
      expect(prompt).toContain('index.ts');
    });

    it('should include only the selected style instructions', () => {
      const prompt = PromptBuilder.generateDocPrompt({
        ...baseParams,
        configuration: { style: 'overview' },
      });
      expect(prompt).toContain('overview');
      expect(prompt).toContain('High-level summary');
      expect(prompt).toContain('500-1000 lines');
      // Should NOT contain instructions for other styles
      expect(prompt).not.toContain('5000-10000+ lines');
    });

    it('should include custom prompt when provided', () => {
      const prompt = PromptBuilder.generateDocPrompt({
        ...baseParams,
        configuration: { customPrompt: 'Focus on API endpoints only' },
      });
      expect(prompt).toContain('Focus on API endpoints only');
    });

    it('should detect project type from codebase', () => {
      const prompt = PromptBuilder.generateDocPrompt({
        ...baseParams,
        codebase: '// File: package.json\n{"name": "test"}',
      });
      expect(prompt).toContain('node-application');
    });

    it('should include repository metadata when provided', () => {
      const prompt = PromptBuilder.generateDocPrompt({
        ...baseParams,
        repository: {
          name: 'my-repo',
          full_name: 'user/my-repo',
          language: 'TypeScript',
        },
      });
      expect(prompt).toContain('user/my-repo');
      expect(prompt).toContain('TypeScript');
    });

    it('should list enabled sections', () => {
      const prompt = PromptBuilder.generateDocPrompt({
        ...baseParams,
        configuration: {
          includeCodeExamples: true,
          includeApiDocs: true,
          includeTroubleshooting: true,
        },
      });
      expect(prompt).toContain('Code Examples');
      expect(prompt).toContain('API Documentation');
      expect(prompt).toContain('Troubleshooting');
    });
  });

  describe('generateTranslationPrompt', () => {
    it('should include source and target languages', () => {
      const prompt = PromptBuilder.generateTranslationPrompt({
        sourceCode: 'print("hello")',
        sourceLanguage: 'Python',
        targetLanguage: 'JavaScript',
      });
      expect(prompt).toContain('Python');
      expect(prompt).toContain('JavaScript');
      expect(prompt).toContain('print("hello")');
    });
  });

  describe('generateCodeReviewPrompt', () => {
    it('should include selected focus areas', () => {
      const prompt = PromptBuilder.generateCodeReviewPrompt(
        { code: 'const x = 1;', language: 'javascript' },
        {
          quality: true,
          security: true,
          performance: false,
          style: false,
          documentation: false,
          depth: 'standard',
        }
      );
      expect(prompt).toContain('Code Quality and Maintainability');
      expect(prompt).toContain('Security Vulnerabilities');
      expect(prompt).not.toContain('Performance Optimization');
    });

    it('should set correct depth level', () => {
      const prompt = PromptBuilder.generateCodeReviewPrompt(
        { code: 'const x = 1;', language: 'typescript' },
        {
          quality: true,
          security: false,
          performance: false,
          style: false,
          documentation: false,
          depth: 'deep',
        }
      );
      expect(prompt).toContain('deep');
    });
  });
});
