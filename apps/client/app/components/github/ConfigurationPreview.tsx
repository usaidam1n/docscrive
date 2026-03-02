'use client';

import React, { useMemo } from 'react';
import { Progress } from '../ui/progress';
import {
  Eye,
  FileText,
  Zap,
  CheckCircle,
  AlertTriangle,
  Info,
  Settings,
  Filter,
  Palette,
  Download,
} from 'lucide-react';
import type { GitHubRepository } from '../../../types/github';
import type {
  DocumentationConfiguration,
  ConfigurationValidation,
} from '../../../types/documentation';

interface ConfigurationPreviewProps {
  config: DocumentationConfiguration;
  repository: GitHubRepository;
  validation: ConfigurationValidation;
}

export function ConfigurationPreview({
  config,
  repository,
  validation,
}: ConfigurationPreviewProps) {
  const metrics = useMemo(() => {
    const baseTokensPerFile = 2000;
    const complexityMultiplier =
      config.style === 'comprehensive'
        ? 1.8
        : config.style === 'technical'
          ? 1.5
          : config.style === 'user-guide'
            ? 1.3
            : config.style === 'api-reference'
              ? 1.4
              : 1.0;

    const estimatedTokensPerFile = Math.round(
      baseTokensPerFile * complexityMultiplier
    );
    const totalTokens = config.maxTotalFiles * estimatedTokensPerFile;
    const baseTimePerFile = 45;
    const modelSpeedMultiplier =
      config.aiModel.includes('mini') ||
      config.aiModel.includes('haiku') ||
      config.aiModel.includes('flash')
        ? 0.7
        : 1.0;
    const concurrencyEfficiency = Math.min(config.concurrency, 5) * 0.8;
    const totalProcessingTime = Math.ceil(
      (config.maxTotalFiles *
        baseTimePerFile *
        complexityMultiplier *
        modelSpeedMultiplier) /
        Math.max(concurrencyEfficiency, 1)
    );

    const costPerToken = config.aiModel.includes('gpt-4o-mini')
      ? 0.000015
      : config.aiModel.includes('gpt-4')
        ? 0.00003
        : config.aiModel.includes('claude-3-5-haiku')
          ? 0.000008
          : config.aiModel.includes('claude')
            ? 0.000015
            : config.aiModel.includes('gemini')
              ? 0.00001
              : 0.00002;
    const estimatedCost = totalTokens * costPerToken;

    return {
      totalTokens,
      estimatedTokensPerFile,
      processingTimeSeconds: totalProcessingTime,
      processingTimeFormatted:
        totalProcessingTime < 60
          ? `${totalProcessingTime}s`
          : totalProcessingTime < 3600
            ? `${Math.round(totalProcessingTime / 60)}m`
            : `${Math.round(totalProcessingTime / 3600)}h`,
      estimatedCost,
      costFormatted:
        estimatedCost < 0.01 ? '<$0.01' : `$${estimatedCost.toFixed(2)}`,
      filesPerBatch: config.batchSize,
      totalBatches: Math.ceil(config.maxTotalFiles / config.batchSize),
    };
  }, [config]);

  const configSummary = useMemo(() => {
    const sections = [];
    sections.push({
      category: 'File Filtering',
      icon: <Filter className="h-3.5 w-3.5" />,
      items: [
        `${config.includePatterns.length} include patterns`,
        `${config.excludePatterns.length} exclude patterns`,
        `Max ${config.maxTotalFiles} files`,
      ],
    });
    const styleFeatures = [];
    if (config.includeCodeExamples) styleFeatures.push('Code examples');
    if (config.includeApiDocs) styleFeatures.push('API docs');
    if (config.includeArchitecture) styleFeatures.push('Architecture');
    if (config.includeSetupInstructions) styleFeatures.push('Setup guide');
    if (config.includeTroubleshooting) styleFeatures.push('Troubleshooting');
    sections.push({
      category: 'Documentation Style',
      icon: <Palette className="h-3.5 w-3.5" />,
      items: [
        `Style: ${config.style}`,
        ...styleFeatures.slice(0, 3).map(f => `• ${f}`),
      ],
    });
    sections.push({
      category: 'Output',
      icon: <Download className="h-3.5 w-3.5" />,
      items: [
        `${config.format.toUpperCase()} / ${config.structure}`,
        config.includeTableOfContents ? '• Table of contents' : '',
        config.includeBadges ? '• Status badges' : '',
      ].filter(Boolean),
    });
    sections.push({
      category: 'Advanced',
      icon: <Settings className="h-3.5 w-3.5" />,
      items: [`Model: ${config.aiModel}`, `Temperature: ${config.temperature}`],
    });
    return sections;
  }, [config]);

  const riskAssessment = useMemo(() => {
    const risks: string[] = [];
    const warnings: string[] = [];
    if (config.maxTotalFiles > 500)
      risks.push('Large file count may result in long processing');
    if (config.includePrivateFiles)
      risks.push('Private files may expose sensitive information');
    if (config.concurrency > 5)
      warnings.push('High concurrency may trigger rate limits');
    if (metrics.estimatedCost > 10)
      warnings.push('High estimated cost — consider reducing scope');
    if (config.temperature > 0.7)
      warnings.push('High temperature may reduce consistency');
    return { risks, warnings };
  }, [config, metrics]);

  return (
    <div className="space-y-5">
      {/* Validation */}
      <div
        className={`rounded-xl border p-3.5 ${validation.isValid ? 'border-[#2ecc71]/20 bg-[#2ecc71]/[0.04]' : 'border-red-500/20 bg-red-500/[0.04]'}`}
      >
        <div className="flex items-center gap-3">
          {validation.isValid ? (
            <CheckCircle className="h-5 w-5 text-[#2ecc71]/70" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-red-400/70" />
          )}
          <div className="flex-1">
            <div
              className={`text-xs font-semibold ${validation.isValid ? 'text-[#2ecc71]' : 'text-red-400'}`}
            >
              Configuration {validation.isValid ? 'Valid' : 'Invalid'}
            </div>
            <div className="text-[10px] text-zinc-500">
              Score: {validation.score}/100
            </div>
          </div>
          <Progress value={validation.score} className="h-1.5 w-20" />
        </div>
        {validation.errors.length > 0 && (
          <div className="mt-2.5 space-y-1">
            {validation.errors.map((error, index) => (
              <div
                key={index}
                className="flex items-center gap-1.5 text-[11px] text-red-400/80"
              >
                <AlertTriangle className="h-2.5 w-2.5 shrink-0" /> {error}
              </div>
            ))}
          </div>
        )}
        {validation.warnings.length > 0 && (
          <div className="mt-2 space-y-1">
            {validation.warnings.map((warning, index) => (
              <div
                key={index}
                className="flex items-center gap-1.5 text-[11px] text-amber-400/70"
              >
                <Info className="h-2.5 w-2.5 shrink-0" /> {warning}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 text-center">
          <div className="text-lg font-bold text-blue-400">
            {metrics.totalTokens.toLocaleString()}
          </div>
          <div className="mt-0.5 text-[10px] font-medium text-zinc-600">
            Tokens
          </div>
          <div className="text-[9px] text-zinc-700">
            ~{metrics.estimatedTokensPerFile}/file
          </div>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 text-center">
          <div className="text-lg font-bold text-[#2ecc71]">
            {metrics.processingTimeFormatted}
          </div>
          <div className="mt-0.5 text-[10px] font-medium text-zinc-600">
            Processing
          </div>
          <div className="text-[9px] text-zinc-700">
            {metrics.totalBatches} batches
          </div>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 text-center">
          <div className="text-lg font-bold text-purple-400">
            {metrics.costFormatted}
          </div>
          <div className="mt-0.5 text-[10px] font-medium text-zinc-600">
            Est. Cost
          </div>
          <div className="text-[9px] text-zinc-700">API usage</div>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 text-center">
          <div className="text-lg font-bold text-amber-400">
            {config.maxTotalFiles}
          </div>
          <div className="mt-0.5 text-[10px] font-medium text-zinc-600">
            Max Files
          </div>
          <div className="text-[9px] text-zinc-700">
            {config.batchSize}/batch
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-3.5">
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-zinc-400">
          <Eye className="h-3 w-3" /> Configuration Summary
        </div>
        <div className="grid grid-cols-2 gap-4">
          {configSummary.map(section => (
            <div key={section.category} className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400">
                {section.icon} {section.category}
              </div>
              <div className="ml-5 space-y-0.5">
                {section.items.map((item, index) => (
                  <div key={index} className="text-[10px] text-zinc-600">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Repo Info */}
      <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-3.5">
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-zinc-400">
          <FileText className="h-3 w-3" /> Repository
        </div>
        <div className="space-y-1.5">
          {[
            ['Name', repository.full_name],
            ['Language', repository.language || 'Mixed'],
            ['Size', `${Math.round((repository.size || 0) / 1024)} MB`],
            ['Visibility', repository.private ? 'Private' : 'Public'],
            ['Updated', new Date(repository.updated_at).toLocaleDateString()],
          ].map(([label, value]) => (
            <div
              key={label}
              className="flex items-center justify-between text-[11px]"
            >
              <span className="font-medium text-zinc-500">{label}</span>
              <span className="text-zinc-400">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Risks */}
      {(riskAssessment.risks.length > 0 ||
        riskAssessment.warnings.length > 0) && (
        <div className="space-y-2">
          {riskAssessment.risks.map((risk, index) => (
            <div
              key={`r${index}`}
              className="flex items-start gap-2 rounded-lg border border-red-500/15 bg-red-500/5 p-3"
            >
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400/70" />
              <p className="text-[11px] text-red-400/80">{risk}</p>
            </div>
          ))}
          {riskAssessment.warnings.map((warning, index) => (
            <div
              key={`w${index}`}
              className="flex items-start gap-2 rounded-lg border border-amber-500/15 bg-amber-500/5 p-3"
            >
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400/70" />
              <p className="text-[11px] text-amber-400/80">{warning}</p>
            </div>
          ))}
        </div>
      )}

      {/* Expected Output */}
      <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-3.5">
        <div className="mb-2.5 text-xs font-medium text-zinc-400">
          Expected Output Structure
        </div>
        <div className="space-y-1 font-mono text-[11px] text-zinc-600">
          {config.structure === 'single-file' && (
            <div>
              📄 README.{config.format === 'markdown' ? 'md' : config.format}
            </div>
          )}
          {config.structure === 'hierarchical' && (
            <div className="space-y-0.5">
              <div>📁 docs/</div>
              <div className="ml-4">
                📄 README.{config.format === 'markdown' ? 'md' : config.format}
              </div>
              {config.includeSetupInstructions && (
                <div className="ml-4">
                  📄 installation.
                  {config.format === 'markdown' ? 'md' : config.format}
                </div>
              )}
              {config.includeApiDocs && (
                <div className="ml-4">
                  📄 api-reference.
                  {config.format === 'markdown' ? 'md' : config.format}
                </div>
              )}
              {config.includeCodeExamples && (
                <div className="ml-4">
                  📄 examples.
                  {config.format === 'markdown' ? 'md' : config.format}
                </div>
              )}
              {config.includeArchitecture && (
                <div className="ml-4">
                  📄 architecture.
                  {config.format === 'markdown' ? 'md' : config.format}
                </div>
              )}
              {config.includeTroubleshooting && (
                <div className="ml-4">
                  📄 troubleshooting.
                  {config.format === 'markdown' ? 'md' : config.format}
                </div>
              )}
              {config.includeContributingGuide && (
                <div className="ml-4">
                  📄 contributing.
                  {config.format === 'markdown' ? 'md' : config.format}
                </div>
              )}
            </div>
          )}
          {config.structure === 'modular' && (
            <div className="space-y-0.5">
              <div>📁 docs/</div>
              <div className="ml-4">
                📄 README.{config.format === 'markdown' ? 'md' : config.format}
              </div>
              <div className="ml-4">📁 components/</div>
              <div className="ml-8">
                📄 [component-docs].
                {config.format === 'markdown' ? 'md' : config.format}
              </div>
              <div className="ml-4">📁 api/</div>
              <div className="ml-8">
                📄 [api-docs].
                {config.format === 'markdown' ? 'md' : config.format}
              </div>
              <div className="ml-4">📁 guides/</div>
              <div className="ml-8">
                📄 [guide-docs].
                {config.format === 'markdown' ? 'md' : config.format}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
