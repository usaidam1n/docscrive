'use client';

import React, { useCallback, useMemo } from 'react';
import { Switch } from '../ui/switch';
import { Slider } from '../ui/slider';
import {
  Settings,
  Zap,
  Shield,
  Cpu,
  AlertTriangle,
  Info,
  Brain,
} from 'lucide-react';
import type { DocumentationConfiguration } from '../../../types/documentation';

interface AdvancedConfigProps {
  config: DocumentationConfiguration;
  onChange: (updates: Partial<DocumentationConfiguration>) => void;
}

export function AdvancedConfig({ config, onChange }: AdvancedConfigProps) {
  const modelProvider = useMemo(() => {
    if (!config.aiModel) return 'Local';
    try {
      const s = String(config.aiModel);
      if (s.includes(':')) return s.split(':')[0];
      return 'Local';
    } catch {
      return 'Local';
    }
  }, [config.aiModel]);

  const estimatedMetrics = useMemo(() => {
    const baseTokensPerFile = 2000;
    const totalTokens = config.maxTotalFiles * baseTokensPerFile;
    const processingTimeMinutes = Math.ceil(
      (config.maxTotalFiles * 30) / (config.concurrency * 60)
    );
    const costPerToken = config.aiModel.includes('gpt-4')
      ? 0.00003
      : config.aiModel.includes('claude')
        ? 0.000015
        : 0.00001;
    const estimatedCost = (totalTokens * costPerToken).toFixed(2);
    return {
      totalTokens: totalTokens.toLocaleString(),
      processingTime: processingTimeMinutes,
      estimatedCost: `$${estimatedCost}`,
    };
  }, [config.maxTotalFiles, config.concurrency, config.aiModel]);

  const handleTemperatureChange = useCallback(
    (value: number[]) => {
      onChange({ temperature: value[0] });
    },
    [onChange]
  );
  const handleMaxTokensChange = useCallback(
    (value: number[]) => {
      onChange({ maxTokensPerFile: value[0] });
    },
    [onChange]
  );
  const handleToggle = useCallback(
    (key: string, value: boolean) => {
      onChange({ [key]: value });
    },
    [onChange]
  );

  return (
    <div className="space-y-5">
      {/* Processing Estimates */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 text-center">
          <div className="text-lg font-bold text-blue-400">
            {estimatedMetrics.totalTokens}
          </div>
          <div className="mt-0.5 text-[10px] font-medium text-zinc-600">
            Est. Tokens
          </div>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 text-center">
          <div className="text-lg font-bold text-[#2ecc71]">
            {estimatedMetrics.processingTime}m
          </div>
          <div className="mt-0.5 text-[10px] font-medium text-zinc-600">
            Est. Time
          </div>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 text-center">
          <div className="text-lg font-bold text-purple-400">
            {estimatedMetrics.estimatedCost}
          </div>
          <div className="mt-0.5 text-[10px] font-medium text-zinc-600">
            Est. Cost
          </div>
        </div>
      </div>

      {/* AI Model (read-only) */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
          <Brain className="h-3 w-3" /> AI Model
        </div>
        <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
          <div>
            <div className="text-xs font-medium text-zinc-300">
              {typeof config.aiModel === 'string' && config.aiModel
                ? config.aiModel
                : 'Default'}
            </div>
            <p className="mt-0.5 text-[10px] text-zinc-600">
              Model is managed in global settings
            </p>
          </div>
          <span className="rounded bg-white/[0.04] px-2 py-0.5 font-mono text-[10px] text-zinc-500">
            {modelProvider}
          </span>
        </div>
      </div>

      {/* Temperature */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-400">
            Temperature (Creativity)
          </span>
          <span className="rounded bg-white/[0.04] px-2 py-0.5 font-mono text-[10px] text-zinc-500">
            {config.temperature.toFixed(2)}
          </span>
        </div>
        <Slider
          value={[config.temperature]}
          onValueChange={handleTemperatureChange}
          max={1}
          min={0}
          step={0.1}
          className="w-full"
        />
        <div className="flex justify-between text-[10px] text-zinc-600">
          <span>0.0 (Focused)</span>
          <span>1.0 (Creative)</span>
        </div>
        <p className="text-[10px] text-zinc-600">
          Lower = more focused. Higher = more creative but less accurate.
        </p>
      </div>

      {/* Max tokens */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-400">
            Max Tokens per File
          </span>
          <span className="rounded bg-white/[0.04] px-2 py-0.5 font-mono text-[10px] text-zinc-500">
            {config.maxTokensPerFile.toLocaleString()}
          </span>
        </div>
        <Slider
          value={[config.maxTokensPerFile]}
          onValueChange={handleMaxTokensChange}
          max={8000}
          min={1000}
          step={500}
          className="w-full"
        />
        <div className="flex justify-between text-[10px] text-zinc-600">
          <span>1,000 tokens</span>
          <span>8,000 tokens</span>
        </div>
      </div>

      {/* Security */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
          <Shield className="h-3 w-3" /> Security & Privacy
        </div>
        <div className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-white/[0.02] p-3">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-white/[0.05] p-1.5 text-zinc-500">
              <Shield className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="text-xs font-medium text-zinc-300">
                Include Private Files
              </div>
              <div className="text-[10px] text-zinc-600">
                May expose sensitive information
              </div>
            </div>
          </div>
          <Switch
            checked={config.includePrivateFiles}
            onCheckedChange={checked =>
              handleToggle('includePrivateFiles', checked)
            }
          />
        </div>
        {config.includePrivateFiles && (
          <div className="flex items-start gap-2 rounded-lg border border-red-500/15 bg-red-500/5 p-3">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400/70" />
            <p className="text-[11px] text-red-400/80">
              Including private files may expose API keys, passwords, or
              proprietary code. Review file filters carefully.
            </p>
          </div>
        )}
      </div>

      {/* Experimental */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
          <Settings className="h-3 w-3" /> Experimental
        </div>
        <div className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-white/[0.02] p-3">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-white/[0.05] p-1.5 text-zinc-500">
              <Info className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="text-xs font-medium text-zinc-300">
                Generate Diagrams
              </div>
              <div className="text-[10px] text-zinc-600">
                Auto-generate architecture and flow diagrams
              </div>
              <div className="mt-0.5 text-[9px] text-amber-400/60">
                🧪 May increase processing time
              </div>
            </div>
          </div>
          <Switch
            checked={config.generateDiagrams}
            onCheckedChange={checked =>
              handleToggle('generateDiagrams', checked)
            }
          />
        </div>
      </div>

      {/* Perf warnings */}
      {(config.concurrency > 5 ||
        config.maxTokensPerFile > 6000 ||
        config.batchSize > 30) && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/15 bg-amber-500/5 p-3">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400/70" />
          <p className="text-[11px] text-amber-400/80">
            Current settings may result in high resource usage or rate limiting.
            Consider reducing values.
          </p>
        </div>
      )}
    </div>
  );
}
