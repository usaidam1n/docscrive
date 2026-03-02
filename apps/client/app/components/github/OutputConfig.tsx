'use client';

import React, { useCallback } from 'react';
import { Switch } from '../ui/switch';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import {
  FileText,
  Globe,
  FileDown,
  Layers,
  List,
  Award,
  GitBranch,
  Download,
  Eye,
  Code,
} from 'lucide-react';
import type { DocumentationConfiguration } from '../../../types/documentation';

interface OutputConfigProps {
  config: DocumentationConfiguration;
  onChange: (updates: Partial<DocumentationConfiguration>) => void;
}

const OUTPUT_FORMATS = [
  {
    id: 'markdown',
    name: 'Markdown',
    description: 'Standard Markdown, perfect for GitHub',
    icon: <FileText className="h-4 w-4" />,
    features: ['GitHub compatible', 'Easy to edit', 'Version control friendly'],
    fileExtension: '.md',
    pros: ['Universal compatibility', 'Easy to maintain'],
    cons: ['Limited styling'],
  },
  {
    id: 'pdf',
    name: 'PDF',
    description: 'Professional PDF for printing and sharing',
    icon: <FileDown className="h-4 w-4" />,
    features: ['Print-ready', 'Professional', 'Portable'],
    fileExtension: '.pdf',
    pros: ['Professional appearance', 'Print-ready'],
    cons: ['Not editable', 'Large file size'],
  },
];

const STRUCTURE_OPTIONS = [
  {
    id: 'single-file',
    name: 'Single File',
    description: 'All documentation in one comprehensive file',
    icon: <FileText className="h-3.5 w-3.5" />,
    pros: ['Easy to navigate', 'Single download'],
    cons: ['Can be very long'],
  },
];

const ADDITIONAL_OPTIONS: Array<{
  key: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  comingSoon?: boolean;
}> = [
  {
    key: 'includeTableOfContents',
    name: 'Table of Contents',
    description: 'Generate a comprehensive ToC',
    icon: <List className="h-3.5 w-3.5" />,
  },
  {
    key: 'includeBadges',
    name: 'Status Badges',
    description: 'Build status, version badges',
    icon: <Award className="h-3.5 w-3.5" />,
  },
  {
    key: 'includeContributingGuide',
    name: 'Contributing Guide',
    description: 'Guidelines for contributors',
    icon: <GitBranch className="h-3.5 w-3.5" />,
  },
  {
    key: 'enableAutoSync',
    name: 'Enable Auto-Sync (Webhook)',
    description: 'Automatically sync docs on pushing to main branch',
    icon: <Globe className="h-3.5 w-3.5 text-blue-400" />,
    comingSoon: true,
  },
];

export function OutputConfig({ config, onChange }: OutputConfigProps) {
  const handleFormatChange = useCallback(
    (format: string) => {
      onChange({ format: format as any });
    },
    [onChange]
  );
  const handleStructureChange = useCallback(
    (structure: string) => {
      onChange({ structure: structure as any });
    },
    [onChange]
  );
  const handleOptionToggle = useCallback(
    (key: string, value: boolean) => {
      onChange({ [key]: value });
    },
    [onChange]
  );

  const selectedFormat = OUTPUT_FORMATS.find(f => f.id === config.format);
  const selectedStructure = STRUCTURE_OPTIONS.find(
    s => s.id === config.structure
  );

  return (
    <div className="space-y-5">
      {/* Format Selection */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
          <Download className="h-3 w-3" /> Output Format
        </div>
        <RadioGroup value={config.format} onValueChange={handleFormatChange}>
          <div className="space-y-2">
            {OUTPUT_FORMATS.map(format => (
              <div key={format.id} className="relative">
                <RadioGroupItem
                  value={format.id}
                  id={format.id}
                  className="peer sr-only"
                />
                <label
                  htmlFor={format.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-all ${
                    config.format === format.id
                      ? 'border-purple-500/30 bg-purple-500/[0.06] ring-1 ring-purple-500/20'
                      : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1] hover:bg-white/[0.04]'
                  }`}
                >
                  <div
                    className={`mt-0.5 shrink-0 rounded-lg p-1.5 ${config.format === format.id ? 'bg-purple-500/15 text-purple-400' : 'bg-white/[0.05] text-zinc-500'}`}
                  >
                    {format.icon}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-semibold ${config.format === format.id ? 'text-white' : 'text-zinc-300'}`}
                      >
                        {format.name}
                      </span>
                      <span className="rounded bg-white/[0.04] px-1.5 py-0.5 font-mono text-[9px] text-zinc-600">
                        {format.fileExtension}
                      </span>
                    </div>
                    <div className="text-[10px] text-zinc-600">
                      {format.description}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {format.features.map(feature => (
                        <span
                          key={feature}
                          className={`rounded px-1.5 py-0.5 text-[9px] font-medium ${config.format === format.id ? 'bg-purple-500/10 text-purple-400/80' : 'bg-white/[0.04] text-zinc-600'}`}
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </label>
              </div>
            ))}
          </div>
        </RadioGroup>
      </div>

      {/* Structure */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
          <Layers className="h-3 w-3" /> Structure
        </div>
        <RadioGroup
          value={config.structure}
          onValueChange={handleStructureChange}
        >
          <div className="space-y-2">
            {STRUCTURE_OPTIONS.map(structure => (
              <div key={structure.id} className="relative">
                <RadioGroupItem
                  value={structure.id}
                  id={structure.id}
                  className="peer sr-only"
                />
                <label
                  htmlFor={structure.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-all ${
                    config.structure === structure.id
                      ? 'border-purple-500/30 bg-purple-500/[0.06] ring-1 ring-purple-500/20'
                      : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1] hover:bg-white/[0.04]'
                  }`}
                >
                  <div
                    className={`mt-0.5 shrink-0 rounded-lg p-1.5 ${config.structure === structure.id ? 'bg-purple-500/15 text-purple-400' : 'bg-white/[0.05] text-zinc-500'}`}
                  >
                    {structure.icon}
                  </div>
                  <div>
                    <div
                      className={`text-xs font-semibold ${config.structure === structure.id ? 'text-white' : 'text-zinc-300'}`}
                    >
                      {structure.name}
                    </div>
                    <div className="text-[10px] text-zinc-600">
                      {structure.description}
                    </div>
                  </div>
                </label>
              </div>
            ))}
          </div>
        </RadioGroup>
      </div>

      {/* Additional Options */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
          <Eye className="h-3 w-3" /> Additional Options
        </div>
        <div className="space-y-2">
          {ADDITIONAL_OPTIONS.map(option => (
            <div
              key={option.key}
              className={`flex items-center justify-between rounded-xl border border-white/[0.04] bg-white/[0.02] p-3 transition-colors ${option.comingSoon ? 'cursor-not-allowed opacity-60' : 'hover:bg-white/[0.04]'}`}
            >
              <div className="flex items-center gap-2.5">
                <div className="rounded-lg bg-white/[0.05] p-1.5 text-zinc-500">
                  {option.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <div className="text-xs font-medium text-zinc-300">
                      {option.name}
                    </div>
                    {option.comingSoon && (
                      <span className="rounded border border-blue-500/20 bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-blue-400">
                        Coming Soon
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-zinc-600">
                    {option.description}
                  </div>
                </div>
              </div>
              <Switch
                checked={
                  config[
                    option.key as keyof DocumentationConfiguration
                  ] as boolean
                }
                onCheckedChange={checked =>
                  handleOptionToggle(option.key, checked)
                }
                disabled={option.comingSoon}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="space-y-2 rounded-xl border border-white/[0.04] bg-white/[0.02] p-3">
        <div className="text-xs font-medium text-zinc-400">Output Preview</div>
        <div className="space-y-1.5 text-[11px] text-zinc-600">
          <div className="flex items-center gap-2">
            <span className="font-medium text-zinc-500">Format:</span>
            <span>
              {selectedFormat?.name} ({selectedFormat?.fileExtension})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-zinc-500">Structure:</span>
            <span>{selectedStructure?.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-zinc-500">Extras:</span>
            <span>
              {[
                config.includeTableOfContents && 'ToC',
                config.includeBadges && 'Badges',
                config.includeContributingGuide && 'Contributing',
                config.enableAutoSync && 'Auto-Sync',
              ]
                .filter(Boolean)
                .join(', ') || 'None'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
