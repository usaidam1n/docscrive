'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Slider } from '../ui/slider';
import {
  Plus,
  X,
  FileText,
  Folder,
  AlertCircle,
  Info,
  Filter,
  HardDrive,
} from 'lucide-react';
import type { GitHubRepository } from '../../../types/github';
import type { DocumentationConfiguration } from '../../../types/documentation';

interface FileFilterConfigProps {
  config: DocumentationConfiguration;
  onChange: (updates: Partial<DocumentationConfiguration>) => void;
  repository: GitHubRepository;
}

const COMMON_PATTERNS = {
  include: [
    '**/*.{js,ts,jsx,tsx}',
    '**/*.{py,pyx,pyi}',
    '**/*.{java,kt,scala}',
    '**/*.{go,rs,cpp,c,h}',
    '**/*.{php,rb,swift}',
    '**/*.{md,mdx,txt}',
    '**/*.{json,yaml,yml,toml}',
    '**/*.{sql,graphql}',
    'README*',
    'CHANGELOG*',
    'LICENSE*',
  ],
  exclude: [
    'node_modules/**',
    'dist/**',
    'build/**',
    'out/**',
    '.git/**',
    '.next/**',
    'coverage/**',
    'target/**',
    'vendor/**',
    '**/*.test.*',
    '**/*.spec.*',
    '**/*.min.*',
    '**/*.map',
    '**/.DS_Store',
    '**/Thumbs.db',
    '**/*.log',
    '**/*.tmp',
    '**/*.cache',
  ],
};

const LANGUAGE_PATTERNS: Record<string, string[]> = {
  javascript: [
    '**/*.{js,jsx,mjs,cjs}',
    '**/*.json',
    'package.json',
    'tsconfig.json',
  ],
  typescript: [
    '**/*.{ts,tsx,d.ts}',
    '**/*.json',
    'package.json',
    'tsconfig.json',
  ],
  python: [
    '**/*.{py,pyx,pyi}',
    'requirements.txt',
    'setup.py',
    'pyproject.toml',
  ],
  java: [
    '**/*.{java,kt,scala}',
    'pom.xml',
    'build.gradle',
    'gradle.properties',
  ],
  go: ['**/*.go', 'go.mod', 'go.sum', 'Makefile'],
  rust: ['**/*.rs', 'Cargo.toml', 'Cargo.lock'],
  php: ['**/*.php', 'composer.json', 'composer.lock'],
  ruby: ['**/*.rb', 'Gemfile', 'Gemfile.lock', 'Rakefile'],
  swift: ['**/*.swift', 'Package.swift', '**/*.xcodeproj/**'],
  csharp: ['**/*.cs', '**/*.csproj', '**/*.sln'],
};

export function FileFilterConfig({
  config,
  onChange,
  repository,
}: FileFilterConfigProps) {
  const [newIncludePattern, setNewIncludePattern] = useState('');
  const [newExcludePattern, setNewExcludePattern] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const suggestedPatterns = useMemo(() => {
    const language = repository.language?.toLowerCase();
    if (language && LANGUAGE_PATTERNS[language])
      return LANGUAGE_PATTERNS[language];
    return [];
  }, [repository.language]);

  const estimatedStats = useMemo(() => {
    const sizeKB = repository.size || 0;
    const estimatedFiles = Math.min(
      Math.max(Math.floor(sizeKB / 10), 10),
      2000
    );
    const estimatedIncludedFiles = Math.min(
      estimatedFiles * 0.6,
      config.maxTotalFiles
    );
    return {
      totalFiles: estimatedFiles,
      includedFiles: Math.floor(estimatedIncludedFiles),
      excludedFiles: estimatedFiles - Math.floor(estimatedIncludedFiles),
      totalSize: sizeKB * 1024,
    };
  }, [repository.size, config.maxTotalFiles]);

  const handleAddIncludePattern = useCallback(() => {
    if (newIncludePattern.trim()) {
      onChange({
        includePatterns: [...config.includePatterns, newIncludePattern.trim()],
      });
      setNewIncludePattern('');
    }
  }, [newIncludePattern, config.includePatterns, onChange]);

  const handleRemoveIncludePattern = useCallback(
    (index: number) => {
      onChange({
        includePatterns: config.includePatterns.filter((_, i) => i !== index),
      });
    },
    [config.includePatterns, onChange]
  );

  const handleAddExcludePattern = useCallback(() => {
    if (newExcludePattern.trim()) {
      onChange({
        excludePatterns: [...config.excludePatterns, newExcludePattern.trim()],
      });
      setNewExcludePattern('');
    }
  }, [newExcludePattern, config.excludePatterns, onChange]);

  const handleRemoveExcludePattern = useCallback(
    (index: number) => {
      onChange({
        excludePatterns: config.excludePatterns.filter((_, i) => i !== index),
      });
    },
    [config.excludePatterns, onChange]
  );

  const handleAddSuggestedPattern = useCallback(
    (pattern: string, type: 'include' | 'exclude') => {
      if (type === 'include' && !config.includePatterns.includes(pattern)) {
        onChange({ includePatterns: [...config.includePatterns, pattern] });
      } else if (
        type === 'exclude' &&
        !config.excludePatterns.includes(pattern)
      ) {
        onChange({ excludePatterns: [...config.excludePatterns, pattern] });
      }
    },
    [config.includePatterns, config.excludePatterns, onChange]
  );

  const handleMaxFileSizeChange = useCallback(
    (value: number[]) => {
      onChange({ maxFileSize: value[0] * 1024 });
    },
    [onChange]
  );

  const handleMaxTotalFilesChange = useCallback(
    (value: number[]) => {
      onChange({ maxTotalFiles: value[0] });
    },
    [onChange]
  );

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 text-center">
          <div className="text-lg font-bold text-blue-400">
            {estimatedStats.totalFiles.toLocaleString()}
          </div>
          <div className="mt-0.5 text-[10px] font-medium text-zinc-600">
            Total Files
          </div>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 text-center">
          <div className="text-lg font-bold text-[#2ecc71]">
            {estimatedStats.includedFiles.toLocaleString()}
          </div>
          <div className="mt-0.5 text-[10px] font-medium text-zinc-600">
            Included
          </div>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 text-center">
          <div className="text-lg font-bold text-red-400">
            {estimatedStats.excludedFiles.toLocaleString()}
          </div>
          <div className="mt-0.5 text-[10px] font-medium text-zinc-600">
            Excluded
          </div>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 text-center">
          <div className="text-lg font-bold text-purple-400">
            {(estimatedStats.totalSize / (1024 * 1024)).toFixed(1)}MB
          </div>
          <div className="mt-0.5 text-[10px] font-medium text-zinc-600">
            Total Size
          </div>
        </div>
      </div>

      {/* Include Patterns */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
          <FileText className="h-3 w-3" /> Include Patterns
        </div>
        <div className="flex flex-wrap gap-1.5">
          {config.includePatterns.map((pattern, index) => (
            <span
              key={index}
              className="flex items-center gap-1.5 rounded-lg border border-[#2ecc71]/15 bg-[#2ecc71]/10 px-2.5 py-1 text-[11px] font-medium text-[#2ecc71]"
            >
              {pattern}
              <button
                onClick={() => handleRemoveIncludePattern(index)}
                className="transition-colors hover:text-white"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            placeholder="e.g., **/*.js or src/**/*.ts"
            value={newIncludePattern}
            onChange={e => setNewIncludePattern(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleAddIncludePattern()}
            className="h-9 flex-1 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 text-xs text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-white/[0.12]"
          />
          <button
            onClick={handleAddIncludePattern}
            disabled={!newIncludePattern.trim()}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.05] text-zinc-400 transition-colors hover:bg-white/[0.08] hover:text-white disabled:opacity-40"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        {suggestedPatterns.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-medium text-zinc-600">
              Suggested for {repository.language}:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {suggestedPatterns.map(pattern => (
                <button
                  key={pattern}
                  onClick={() => handleAddSuggestedPattern(pattern, 'include')}
                  disabled={config.includePatterns.includes(pattern)}
                  className="flex items-center gap-1 rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-1 text-[10px] text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-white disabled:opacity-30"
                >
                  <Plus className="h-2.5 w-2.5" /> {pattern}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="space-y-1.5">
          <span className="text-[10px] font-medium text-zinc-600">Common:</span>
          <div className="flex flex-wrap gap-1.5">
            {COMMON_PATTERNS.include.map(pattern => (
              <button
                key={pattern}
                onClick={() => handleAddSuggestedPattern(pattern, 'include')}
                disabled={config.includePatterns.includes(pattern)}
                className="flex items-center gap-1 rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-1 text-[10px] text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-white disabled:opacity-30"
              >
                <Plus className="h-2.5 w-2.5" /> {pattern}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Exclude Patterns */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
          <Folder className="h-3 w-3" /> Exclude Patterns
        </div>
        <div className="flex flex-wrap gap-1.5">
          {config.excludePatterns.map((pattern, index) => (
            <span
              key={index}
              className="flex items-center gap-1.5 rounded-lg border border-red-500/15 bg-red-500/10 px-2.5 py-1 text-[11px] font-medium text-red-400"
            >
              {pattern}
              <button
                onClick={() => handleRemoveExcludePattern(index)}
                className="transition-colors hover:text-white"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            placeholder="e.g., node_modules/** or **/*.test.js"
            value={newExcludePattern}
            onChange={e => setNewExcludePattern(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleAddExcludePattern()}
            className="h-9 flex-1 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 text-xs text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-white/[0.12]"
          />
          <button
            onClick={handleAddExcludePattern}
            disabled={!newExcludePattern.trim()}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.05] text-zinc-400 transition-colors hover:bg-white/[0.08] hover:text-white disabled:opacity-40"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="space-y-1.5">
          <span className="text-[10px] font-medium text-zinc-600">Common:</span>
          <div className="flex flex-wrap gap-1.5">
            {COMMON_PATTERNS.exclude.map(pattern => (
              <button
                key={pattern}
                onClick={() => handleAddSuggestedPattern(pattern, 'exclude')}
                disabled={config.excludePatterns.includes(pattern)}
                className="flex items-center gap-1 rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-1 text-[10px] text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-white disabled:opacity-30"
              >
                <Plus className="h-2.5 w-2.5" /> {pattern}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Limits */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
          <Filter className="h-3 w-3" /> Processing Limits
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">
              Max File Size
            </span>
            <span className="rounded bg-white/[0.04] px-2 py-0.5 font-mono text-[10px] text-zinc-500">
              {config.maxFileSize >= 1024 * 1024
                ? `${(config.maxFileSize / (1024 * 1024)).toFixed(1)} MB`
                : `${Math.round(config.maxFileSize / 1024)} KB`}
            </span>
          </div>
          <Slider
            value={[config.maxFileSize / 1024]}
            onValueChange={handleMaxFileSizeChange}
            max={5120}
            min={10}
            step={10}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-zinc-600">
            <span>10 KB</span>
            <span>5 MB</span>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">
              Max Total Files
            </span>
            <span className="rounded bg-white/[0.04] px-2 py-0.5 font-mono text-[10px] text-zinc-500">
              {config.maxTotalFiles.toLocaleString()}
            </span>
          </div>
          <Slider
            value={[config.maxTotalFiles]}
            onValueChange={handleMaxTotalFilesChange}
            max={1000}
            min={10}
            step={10}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-zinc-600">
            <span>10 files</span>
            <span>1,000 files</span>
          </div>
        </div>
        {estimatedStats.includedFiles > 500 && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-500/15 bg-amber-500/5 p-3">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400/70" />
            <p className="text-[11px] text-amber-400/80">
              Processing {estimatedStats.includedFiles.toLocaleString()} files
              may take significant time. Add more exclude patterns to reduce
              scope.
            </p>
          </div>
        )}
      </div>

      {/* Advanced */}
      <div className="space-y-3">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-300"
        >
          <Info className="h-3 w-3" />
          {showAdvanced ? '▾ Hide' : '▸ Show'} Advanced Options
        </button>
        {showAdvanced && (
          <div className="space-y-3 rounded-lg border border-white/[0.04] bg-white/[0.02] p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-zinc-300">
                  Include Private Files
                </div>
                <p className="mt-0.5 text-[10px] text-zinc-600">
                  Include files that might contain sensitive information
                </p>
              </div>
              <Switch
                checked={config.includePrivateFiles}
                onCheckedChange={checked =>
                  onChange({ includePrivateFiles: checked })
                }
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
