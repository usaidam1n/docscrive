'use client';

import { AdvancedConfigModal } from './AdvancedConfigModal';
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import {
  Settings,
  FileText,
  Palette,
  Download,
  RotateCcw,
  Save,
  ArrowLeft,
  History,
  Star,
  Clock,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import type { GitHubRepository } from '../../../types/github';
import type { DocumentationConfiguration } from '../../../types/documentation';
import { getSelectedModel } from '@/utils/storage';
import {
  saveGitHubConfig,
  getRepositoryConfigs,
  getRecentConfigs,
  compareConfigs,
  type SavedConfiguration,
  type ConfigComparisonResult,
} from '@/utils/github-config-storage';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

interface DocumentationConfigProps {
  repository: GitHubRepository;
  onConfigurationChange: (config: DocumentationConfiguration) => void;
  onNext: () => void;
  onBack: () => void;
  isLoading?: boolean;
}

const DEFAULT_CONFIG: DocumentationConfiguration = {
  // File filtering
  includePatterns: ['**/*.{js,ts,jsx,tsx,py,java,go,rs,cpp,c,h}'],
  excludePatterns: [
    'node_modules/**',
    'dist/**',
    'build/**',
    '.git/**',
    'coverage/**',
    '**/*.test.*',
    '**/*.spec.*',
    '**/*.min.*',
  ],
  maxFileSize: 1024 * 1024, // 1MB
  maxTotalFiles: 20,

  // Documentation style
  style: 'comprehensive',
  includeCodeExamples: true,
  includeApiDocs: true,
  includeArchitecture: true,
  includeSetupInstructions: true,
  includeTroubleshooting: true,

  // Output configuration
  format: 'markdown',
  structure: 'single-file',
  includeTableOfContents: false,
  includeBadges: false,
  includeContributingGuide: false,

  // Advanced options
  aiModel: 'gpt-4o',
  temperature: 0.3,
  maxTokensPerFile: 6000,
  includePrivateFiles: false,
  generateDiagrams: false,
  customPrompt: '',

  // Processing options
  batchSize: 10,
  concurrency: 3,
  timeout: 300000,

  // Webhook / Sync options
  enableAutoSync: false,
};

export function DocumentationConfig({
  repository,
  onConfigurationChange,
  onNext,
  onBack,
  isLoading = false,
}: DocumentationConfigProps) {
  const [config, setConfig] =
    useState<DocumentationConfiguration>(DEFAULT_CONFIG);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    'idle' | 'saving' | 'saved' | 'error'
  >('idle');

  // Configuration management state
  const [savedConfigs, setSavedConfigs] = useState<SavedConfiguration[]>([]);
  const [recentConfigs, setRecentConfigs] = useState<SavedConfiguration[]>([]);
  const [selectedConfigId, setSelectedConfigId] = useState<string>('');
  const [configComparison, setConfigComparison] =
    useState<ConfigComparisonResult | null>(null);
  const [currentConfigId, setCurrentConfigId] = useState<string>('');
  const [showConfigSelector, setShowConfigSelector] = useState(false);

  // Modal state
  const [showAdvancedModal, setShowAdvancedModal] = useState(false);

  // Memoized configuration validation
  const configValidation = useMemo(() => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (config.includePatterns.length === 0)
      errors.push('At least one include pattern is required');
    if (config.maxTotalFiles > 1000)
      warnings.push('Processing more than 1000 files may take a long time');
    if (config.maxFileSize > 5 * 1024 * 1024)
      warnings.push('Large file size limit may impact processing speed');
    if (config.temperature < 0 || config.temperature > 1)
      errors.push('Temperature must be between 0 and 1');
    if (config.maxTokensPerFile < 1000 || config.maxTokensPerFile > 8000) {
      warnings.push(
        'Token limit should be between 1000-8000 for optimal results'
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: Math.max(0, 100 - errors.length * 25 - warnings.length * 10),
    };
  }, [config]);

  // Load saved configurations on mount
  useEffect(() => {
    try {
      const model = getSelectedModel();
      if (model && model !== 'no model selected') {
        setConfig(prev => ({ ...prev, aiModel: model }));
      }

      const repoConfigs = getRepositoryConfigs(repository);
      const recents = getRecentConfigs();

      setSavedConfigs(repoConfigs);
      setRecentConfigs(recents);

      if (repoConfigs.length > 0) {
        const mostRecent = repoConfigs[0];
        setConfig(mostRecent);
        setCurrentConfigId(mostRecent.id);
        setSelectedConfigId(mostRecent.id);
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.error('Failed to load saved configurations:', error);
    }
  }, [repository]);

  const handleConfigChange = useCallback(
    (updates: Partial<DocumentationConfiguration>) => {
      setConfig(prev => {
        const newConfig = { ...prev, ...updates };
        setHasUnsavedChanges(true);
        return newConfig;
      });
    },
    []
  );

  const handleSaveConfig = useCallback(
    async (configName?: string) => {
      try {
        setIsSaving(true);
        setSaveStatus('saving');

        const saveResult = saveGitHubConfig(config, {
          name: configName || `${repository.name} Configuration`,
          repository,
          tags: [
            repository.language || 'unknown',
            config.style,
            config.format,
          ].filter(Boolean),
          forceNew: false,
        });

        if (saveResult.success) {
          setCurrentConfigId(saveResult.configId);
          setSelectedConfigId(saveResult.configId);
          setSavedConfigs(getRepositoryConfigs(repository));
          onConfigurationChange(config);
          setHasUnsavedChanges(false);
          setSaveStatus('saved');
        } else {
          throw new Error('Failed to save configuration to localStorage');
        }
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (error) {
        console.error('Failed to save configuration:', error);
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } finally {
        setIsSaving(false);
      }
    },
    [config, onConfigurationChange, repository]
  );

  const handleLoadConfig = useCallback(
    (savedConfig: SavedConfiguration) => {
      const comparison = compareConfigs(config, savedConfig);
      setConfigComparison(comparison);
      setConfig(savedConfig);
      setCurrentConfigId(savedConfig.id);
      setSelectedConfigId(savedConfig.id);
      setHasUnsavedChanges(false);

      // Update usage
      savedConfig.usage.timesUsed += 1;
      savedConfig.usage.lastUsed = new Date().toISOString();
    },
    [config]
  );

  const handleConfigSelection = useCallback(
    (configId: string) => {
      if (configId === 'new') {
        setConfig(DEFAULT_CONFIG);
        setCurrentConfigId('');
        setSelectedConfigId('');
        setHasUnsavedChanges(true);
        setConfigComparison(null);
        return;
      }
      const savedConfig = [...savedConfigs, ...recentConfigs].find(
        c => c.id === configId
      );
      if (savedConfig) handleLoadConfig(savedConfig);
    },
    [savedConfigs, recentConfigs, handleLoadConfig]
  );

  useEffect(() => {
    if (currentConfigId) {
      const currentSaved = savedConfigs.find(c => c.id === currentConfigId);
      if (currentSaved) {
        const comparison = compareConfigs(config, currentSaved);
        setHasUnsavedChanges(!comparison.areEqual);
        setConfigComparison(comparison.areEqual ? null : comparison);
      }
    }
  }, [config, currentConfigId, savedConfigs]);

  const handleResetConfig = useCallback(() => {
    setConfig(DEFAULT_CONFIG);
    setHasUnsavedChanges(true);
  }, []);

  const handleNext = useCallback(async () => {
    if (hasUnsavedChanges) await handleSaveConfig();
    onConfigurationChange(config);
    onNext();
  }, [
    hasUnsavedChanges,
    handleSaveConfig,
    onNext,
    onConfigurationChange,
    config,
  ]);

  const estimatedProcessingTime = useMemo(() => {
    const baseTimePerFile = 2;
    const complexityMultiplier =
      config.style === 'comprehensive'
        ? 1.5
        : config.style === 'technical'
          ? 1.3
          : 1.0;
    const totalTime =
      Math.min(config.maxTotalFiles, 100) *
      baseTimePerFile *
      complexityMultiplier;
    if (totalTime < 60) return `${Math.round(totalTime)} seconds`;
    if (totalTime < 3600) return `${Math.round(totalTime / 60)} minutes`;
    return `${Math.round(totalTime / 3600)} hours`;
  }, [config.maxTotalFiles, config.style]);

  return (
    <div className="space-y-5">
      {/* Compact Header */}
      <div className="workspace-glass p-5">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-500/15 to-purple-500/5">
              <FileText className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-tight text-white">
                {repository.full_name}
              </h2>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <Badge
                  className={
                    repository.private
                      ? 'border border-amber-500/15 bg-amber-500/10 text-[10px] text-amber-400'
                      : 'border border-[#2ecc71]/15 bg-[#2ecc71]/10 text-[10px] text-[#2ecc71]'
                  }
                >
                  {repository.private ? 'Private' : 'Public'}
                </Badge>
                {repository.language && (
                  <Badge className="border border-white/[0.06] bg-white/[0.04] text-[10px] text-zinc-400">
                    {repository.language}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <div
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium ${
                configValidation.isValid
                  ? 'border border-[#2ecc71]/15 bg-[#2ecc71]/10 text-[#2ecc71]'
                  : 'border border-red-500/15 bg-red-500/10 text-red-400'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${configValidation.isValid ? 'bg-[#2ecc71]' : 'bg-red-400'} animate-pulse`}
              />
              {configValidation.isValid ? 'Valid' : 'Invalid'}
              <span className="text-[10px] opacity-60">
                ({configValidation.score}/100)
              </span>
            </div>
            <span className="text-[11px] font-medium text-zinc-600">
              Est: {estimatedProcessingTime}
            </span>
          </div>
        </div>

        {(configValidation.errors.length > 0 ||
          configValidation.warnings.length > 0) && (
          <div className="mt-4 space-y-2">
            {configValidation.errors.map((error, index) => (
              <div
                key={index}
                className="rounded-lg border border-red-500/15 bg-red-500/5 px-3 py-2 text-xs font-medium text-red-400"
              >
                ⚠️ {error}
              </div>
            ))}
            {configValidation.warnings.map((warning, index) => (
              <div
                key={index}
                className="rounded-lg border border-amber-500/15 bg-amber-500/5 px-3 py-2 text-xs font-medium text-amber-400"
              >
                ⚡ {warning}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Saved Configs — Collapsible */}
      <div className="workspace-glass">
        <button
          className="flex w-full items-center justify-between px-5 py-3 transition-colors hover:bg-white/[0.02]"
          onClick={() => setShowConfigSelector(!showConfigSelector)}
        >
          <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
            <History className="h-3.5 w-3.5 text-zinc-500" />
            Saved Configurations
            <span className="text-[10px] font-normal text-zinc-600">
              ({savedConfigs.length})
            </span>
          </div>
          <span className="text-[10px] text-zinc-600">
            {showConfigSelector ? '▾ Hide' : '▸ Show'}
          </span>
        </button>

        {showConfigSelector && (
          <div className="space-y-4 border-t border-white/[0.04] px-5 pb-4 pt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="mb-2 flex items-center gap-2 text-xs font-medium text-zinc-500">
                  <FileText className="h-3 w-3" />
                  Repository Configs
                </h4>
                {savedConfigs.length > 0 ? (
                  <Select
                    value={selectedConfigId}
                    onValueChange={handleConfigSelection}
                  >
                    <SelectTrigger className="h-10 border-white/[0.06] bg-white/[0.03] text-xs text-white">
                      <SelectValue placeholder="Select saved config" />
                    </SelectTrigger>
                    <SelectContent className="border-white/[0.08] bg-[#1a1b1e] text-white">
                      <SelectItem
                        value="new"
                        className="cursor-pointer text-xs hover:bg-white/[0.05] focus:bg-white/[0.05]"
                      >
                        <div className="flex items-center gap-2 text-[#2ecc71]">
                          <Star className="h-3 w-3" />
                          New Configuration
                        </div>
                      </SelectItem>
                      {savedConfigs.map(config => (
                        <SelectItem
                          key={config.id}
                          value={config.id}
                          className="cursor-pointer text-xs hover:bg-white/[0.05] focus:bg-white/[0.05]"
                        >
                          <div>
                            <div className="font-medium text-white">
                              {config.name}
                            </div>
                            <div className="mt-0.5 text-[10px] text-zinc-500">
                              {config.style} • Used {config.usage.timesUsed}x
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-3 text-xs text-zinc-600">
                    No saved configs yet.
                  </div>
                )}
              </div>

              <div>
                <h4 className="mb-2 flex items-center gap-2 text-xs font-medium text-zinc-500">
                  <Clock className="h-3 w-3" />
                  Recent Configs
                </h4>
                {recentConfigs.length > 0 ? (
                  <div className="workspace-scrollbar max-h-[160px] space-y-1.5 overflow-y-auto">
                    {recentConfigs.slice(0, 5).map(config => (
                      <button
                        key={config.id}
                        onClick={() => handleLoadConfig(config)}
                        className="w-full rounded-lg border border-white/[0.04] p-2.5 text-left text-xs transition-colors hover:border-white/[0.08] hover:bg-white/[0.03]"
                      >
                        <div className="truncate font-medium text-zinc-300">
                          {config.name}
                        </div>
                        <div className="mt-0.5 text-[10px] text-zinc-600">
                          {config.repositoryName} •{' '}
                          {new Date(config.usage.lastUsed).toLocaleDateString()}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-3 text-xs text-zinc-600">
                    No recent configs.
                  </div>
                )}
              </div>
            </div>

            {configComparison && !configComparison.areEqual && (
              <div className="rounded-lg border border-amber-500/15 bg-amber-500/5 p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400/70" />
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-amber-300">
                      {configComparison.differences.length} changes detected
                      (similarity:{' '}
                      {Math.round(configComparison.similarityScore)}%)
                    </div>
                    {configComparison.differences
                      .slice(0, 3)
                      .map((diff, index) => (
                        <div
                          key={index}
                          className="flex flex-wrap items-center gap-1.5 rounded border border-white/[0.04] bg-black/30 p-1.5 text-[10px]"
                        >
                          <span className="font-mono text-zinc-400">
                            {diff.path}
                          </span>
                          <span className="text-red-400/70 line-through">
                            {JSON.stringify(diff.oldValue)}
                          </span>
                          <span className="text-zinc-600">→</span>
                          <span className="text-[#2ecc71]/80">
                            {JSON.stringify(diff.newValue)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Smart Configuration */}
      <div className="workspace-glass space-y-5 overflow-hidden p-5">
        <div className="flex items-center gap-2 border-b border-white/[0.04] pb-5">
          <Settings className="h-4 w-4 text-purple-400" />
          <h3 className="text-sm font-semibold text-white">
            Smart Configuration
          </h3>
        </div>

        {/* Style + Model */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
              <Palette className="h-3 w-3 text-purple-400" />
              Documentation Style
            </div>
            <Select
              value={config.style}
              onValueChange={(value: any) =>
                handleConfigChange({ style: value })
              }
            >
              <SelectTrigger className="h-10 w-full rounded-xl border-white/[0.06] bg-white/[0.03] text-xs text-white">
                <SelectValue placeholder="Select style" />
              </SelectTrigger>
              <SelectContent className="border-white/[0.08] bg-[#1a1b1e] text-white">
                <SelectItem
                  value="comprehensive"
                  className="text-xs hover:bg-white/[0.05]"
                >
                  Comprehensive
                </SelectItem>
                <SelectItem
                  value="overview"
                  className="text-xs hover:bg-white/[0.05]"
                >
                  Overview
                </SelectItem>
                <SelectItem
                  value="technical"
                  className="text-xs hover:bg-white/[0.05]"
                >
                  Technical
                </SelectItem>
                <SelectItem
                  value="user-guide"
                  className="text-xs hover:bg-white/[0.05]"
                >
                  User Guide
                </SelectItem>
                <SelectItem
                  value="api-reference"
                  className="text-xs hover:bg-white/[0.05]"
                >
                  API Reference
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
              <Zap className="h-3 w-3 text-purple-400" />
              AI Model
            </div>
            <Select
              value={config.aiModel}
              onValueChange={(value: any) =>
                handleConfigChange({ aiModel: value })
              }
            >
              <SelectTrigger className="h-10 w-full rounded-xl border-white/[0.06] bg-white/[0.03] text-xs text-white">
                <SelectValue placeholder="Select Model" />
              </SelectTrigger>
              <SelectContent className="workspace-scrollbar max-h-[300px] overflow-y-auto border-white/[0.08] bg-[#1a1b1e] text-white">
                <SelectGroup>
                  <SelectLabel className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                    OpenAI
                  </SelectLabel>
                  <SelectItem
                    value="gpt-4o"
                    className="text-xs hover:bg-white/[0.05]"
                  >
                    GPT-4o
                  </SelectItem>
                  <SelectItem
                    value="gpt-4o-mini"
                    className="text-xs hover:bg-white/[0.05]"
                  >
                    GPT-4o Mini
                  </SelectItem>
                  <SelectItem
                    value="o1-preview"
                    className="text-xs hover:bg-white/[0.05]"
                  >
                    o1 Preview
                  </SelectItem>
                  <SelectItem
                    value="o1-mini"
                    className="text-xs hover:bg-white/[0.05]"
                  >
                    o1 Mini
                  </SelectItem>
                  <SelectItem
                    value="gpt-4-turbo"
                    className="text-xs hover:bg-white/[0.05]"
                  >
                    GPT-4 Turbo
                  </SelectItem>
                  <SelectItem
                    value="gpt-3.5-turbo"
                    className="text-xs hover:bg-white/[0.05]"
                  >
                    GPT-3.5 Turbo
                  </SelectItem>
                </SelectGroup>

                <SelectSeparator className="my-1 bg-white/[0.06]" />

                <SelectGroup>
                  <SelectLabel className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                    Anthropic
                  </SelectLabel>
                  <SelectItem
                    value="claude-3-5-sonnet-latest"
                    className="text-xs hover:bg-white/[0.05]"
                  >
                    Claude 3.5 Sonnet
                  </SelectItem>
                  <SelectItem
                    value="claude-3-5-haiku-latest"
                    className="text-xs hover:bg-white/[0.05]"
                  >
                    Claude 3.5 Haiku
                  </SelectItem>
                  <SelectItem
                    value="claude-3-opus-latest"
                    className="text-xs hover:bg-white/[0.05]"
                  >
                    Claude 3 Opus
                  </SelectItem>
                </SelectGroup>

                <SelectSeparator className="my-1 bg-white/[0.06]" />

                <SelectGroup>
                  <SelectLabel className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                    Google
                  </SelectLabel>
                  <SelectItem
                    value="gemini-2.5-pro"
                    className="text-xs hover:bg-white/[0.05]"
                  >
                    Gemini 2.5 Pro
                  </SelectItem>
                  <SelectItem
                    value="gemini-2.5-flash"
                    className="text-xs hover:bg-white/[0.05]"
                  >
                    Gemini 2.5 Flash
                  </SelectItem>
                  <SelectItem
                    value="gemini-1.5-pro"
                    className="text-xs hover:bg-white/[0.05]"
                  >
                    Gemini 1.5 Pro
                  </SelectItem>
                  <SelectItem
                    value="gemini-1.5-flash"
                    className="text-xs hover:bg-white/[0.05]"
                  >
                    Gemini 1.5 Flash
                  </SelectItem>
                </SelectGroup>

                <SelectSeparator className="my-1 bg-white/[0.06]" />

                <SelectGroup>
                  <SelectLabel className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                    Open Source / Other
                  </SelectLabel>
                  <SelectItem
                    value="llama-3.1-70b-versatile"
                    className="text-xs hover:bg-white/[0.05]"
                  >
                    Llama 3.1 70B
                  </SelectItem>
                  <SelectItem
                    value="llama-3.1-8b-instant"
                    className="text-xs hover:bg-white/[0.05]"
                  >
                    Llama 3.1 8B
                  </SelectItem>
                  <SelectItem
                    value="mixtral-8x7b-32768"
                    className="text-xs hover:bg-white/[0.05]"
                  >
                    Mixtral 8x7B
                  </SelectItem>
                  <SelectItem
                    value="grok-beta"
                    className="text-xs hover:bg-white/[0.05]"
                  >
                    Grok Beta
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Advanced Settings Modal Trigger */}
        <button
          onClick={() => setShowAdvancedModal(true)}
          className="flex w-full items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.04]"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.05]">
              <Settings className="h-4 w-4 text-zinc-400" />
            </div>
            <div className="text-left">
              <div className="text-sm font-medium text-zinc-200">
                Advanced Settings
              </div>
              <div className="mt-0.5 text-xs text-zinc-500">
                Custom filters, output formats, token limits, and more
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-[10px] text-zinc-500 sm:block">
              {config.includePatterns.length} incl ·{' '}
              {config.excludePatterns.length} excl
            </div>
            <div className="flex items-center gap-1 text-xs font-medium text-purple-400">
              Open <ArrowLeft className="h-3 w-3 rotate-180" />
            </div>
          </div>
        </button>
      </div>

      {/* Advanced Settings Modal */}
      <AdvancedConfigModal
        open={showAdvancedModal}
        onOpenChange={setShowAdvancedModal}
        config={config}
        onChange={handleConfigChange}
        repository={repository}
        validation={configValidation}
      />

      {/* Action bar */}
      <div className="flex flex-col-reverse justify-between gap-4 sm:flex-row sm:items-center">
        <button
          onClick={onBack}
          disabled={isLoading}
          className="flex h-9 items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.04] px-4 text-xs font-medium text-zinc-400 transition-all hover:bg-white/[0.06] hover:text-white disabled:opacity-50"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </button>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {hasUnsavedChanges && saveStatus === 'idle' && (
            <span className="hidden animate-pulse text-[10px] font-medium text-amber-400/70 sm:inline">
              Unsaved changes
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="hidden text-[10px] font-medium text-[#2ecc71] sm:inline">
              ✓ Saved
            </span>
          )}

          <button
            onClick={handleResetConfig}
            disabled={isLoading || isSaving}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-white/[0.05] hover:text-white disabled:opacity-50"
            title="Reset"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={() => handleSaveConfig()}
            disabled={
              (!hasUnsavedChanges && saveStatus !== 'error') ||
              isLoading ||
              isSaving
            }
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-white/[0.05] hover:text-white disabled:opacity-50"
            title="Save Config"
          >
            <Save className="h-3.5 w-3.5" />
          </button>

          <div className="mx-1 h-5 w-px bg-white/[0.06]" />

          <button
            onClick={handleNext}
            disabled={!configValidation.isValid || isLoading || isSaving}
            className="flex h-9 items-center gap-2 rounded-xl bg-gradient-to-r from-[#2ecc71] to-[#27ae60] px-5 text-sm font-semibold text-black shadow-[0_0_20px_rgba(46,204,113,0.15)] transition-all hover:scale-[1.02] hover:from-[#27ae60] hover:to-[#219a52] hover:shadow-[0_0_30px_rgba(46,204,113,0.25)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
          >
            <Zap className="h-3.5 w-3.5 fill-current" />
            Generate Docs
          </button>
        </div>
      </div>
    </div>
  );
}
