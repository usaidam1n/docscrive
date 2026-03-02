'use client';

import React, { useCallback } from 'react';
import { Switch } from '../ui/switch';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import {
  BookOpen,
  Code,
  Wrench,
  Users,
  Zap,
  FileText,
  Lightbulb,
  Settings,
  Palette,
} from 'lucide-react';
import type { DocumentationConfiguration } from '../../../types/documentation';

interface DocumentationStyleConfigProps {
  config: DocumentationConfiguration;
  onChange: (updates: Partial<DocumentationConfiguration>) => void;
}

const DOCUMENTATION_STYLES = [
  {
    id: 'comprehensive',
    name: 'Comprehensive',
    description:
      'Complete documentation with all sections and detailed explanations',
    icon: <BookOpen className="h-4 w-4" />,
    features: [
      'Full API docs',
      'Code examples',
      'Architecture',
      'Setup',
      'Troubleshooting',
    ],
    estimatedLength: 'Very Long',
    processingTime: 'High',
  },
  {
    id: 'technical',
    name: 'Technical Reference',
    description: 'Focused on technical details, APIs, and implementation',
    icon: <Code className="h-4 w-4" />,
    features: ['API reference', 'Specs', 'Implementation', 'Samples'],
    estimatedLength: 'Long',
    processingTime: 'Medium-High',
  },
  {
    id: 'user-guide',
    name: 'User Guide',
    description: 'User-friendly docs focused on how to use the software',
    icon: <Users className="h-4 w-4" />,
    features: ['Getting started', 'Tutorials', 'Use cases', 'FAQ'],
    estimatedLength: 'Medium',
    processingTime: 'Medium',
  },
  {
    id: 'overview',
    name: 'Project Overview',
    description: 'High-level overview with key concepts and quick start',
    icon: <Zap className="h-4 w-4" />,
    features: ['Summary', 'Quick start', 'Key features', 'Examples'],
    estimatedLength: 'Short',
    processingTime: 'Low',
  },
  {
    id: 'api-reference',
    name: 'API Reference',
    description: 'Structured API docs with endpoints and parameters',
    icon: <Wrench className="h-4 w-4" />,
    features: ['Endpoints', 'Parameters', 'Responses', 'Auth'],
    estimatedLength: 'Medium-Long',
    processingTime: 'Medium',
  },
];

const CONTENT_SECTIONS = [
  {
    key: 'includeCodeExamples',
    name: 'Code Examples',
    description: 'Practical code examples and usage patterns',
    icon: <Code className="h-3.5 w-3.5" />,
  },
  {
    key: 'includeApiDocs',
    name: 'API Documentation',
    description: 'Detailed API docs from code comments',
    icon: <Wrench className="h-3.5 w-3.5" />,
  },
  {
    key: 'includeArchitecture',
    name: 'Architecture Overview',
    description: 'System architecture and design patterns',
    icon: <Settings className="h-3.5 w-3.5" />,
  },
  {
    key: 'includeSetupInstructions',
    name: 'Setup Instructions',
    description: 'Installation and setup guides',
    icon: <Lightbulb className="h-3.5 w-3.5" />,
  },
  {
    key: 'includeTroubleshooting',
    name: 'Troubleshooting',
    description: 'Common issues and solutions',
    icon: <FileText className="h-3.5 w-3.5" />,
  },
];

export function DocumentationStyleConfig({
  config,
  onChange,
}: DocumentationStyleConfigProps) {
  const handleStyleChange = useCallback(
    (style: string) => {
      const selectedStyle = DOCUMENTATION_STYLES.find(s => s.id === style);
      if (selectedStyle) {
        const updates: Partial<DocumentationConfiguration> = {
          style: style as any,
        };
        switch (style) {
          case 'comprehensive':
            Object.assign(updates, {
              includeCodeExamples: true,
              includeApiDocs: true,
              includeArchitecture: true,
              includeSetupInstructions: true,
              includeTroubleshooting: true,
            });
            break;
          case 'technical':
            Object.assign(updates, {
              includeCodeExamples: true,
              includeApiDocs: true,
              includeArchitecture: true,
              includeSetupInstructions: false,
              includeTroubleshooting: false,
            });
            break;
          case 'user-guide':
            Object.assign(updates, {
              includeCodeExamples: true,
              includeApiDocs: false,
              includeArchitecture: false,
              includeSetupInstructions: true,
              includeTroubleshooting: true,
            });
            break;
          case 'overview':
            Object.assign(updates, {
              includeCodeExamples: false,
              includeApiDocs: false,
              includeArchitecture: false,
              includeSetupInstructions: true,
              includeTroubleshooting: false,
            });
            break;
          case 'api-reference':
            Object.assign(updates, {
              includeCodeExamples: true,
              includeApiDocs: true,
              includeArchitecture: false,
              includeSetupInstructions: true,
              includeTroubleshooting: false,
            });
            break;
        }
        onChange(updates);
      }
    },
    [onChange]
  );

  const handleSectionToggle = useCallback(
    (key: string, value: boolean) => {
      onChange({ [key]: value });
    },
    [onChange]
  );

  return (
    <div className="space-y-5">
      {/* Style Selection */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
          <Palette className="h-3 w-3" /> Documentation Style
        </div>
        <RadioGroup value={config.style} onValueChange={handleStyleChange}>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {DOCUMENTATION_STYLES.map(style => (
              <div key={style.id} className="relative">
                <RadioGroupItem
                  value={style.id}
                  id={style.id}
                  className="peer sr-only"
                />
                <label
                  htmlFor={style.id}
                  className={`flex cursor-pointer flex-col rounded-xl border p-3 transition-all ${
                    config.style === style.id
                      ? 'border-purple-500/30 bg-purple-500/[0.06] ring-1 ring-purple-500/20'
                      : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1] hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="mb-2 flex items-center gap-2.5">
                    <div
                      className={`rounded-lg p-1.5 ${config.style === style.id ? 'bg-purple-500/15 text-purple-400' : 'bg-white/[0.05] text-zinc-500'}`}
                    >
                      {style.icon}
                    </div>
                    <div>
                      <div
                        className={`text-xs font-semibold ${config.style === style.id ? 'text-white' : 'text-zinc-300'}`}
                      >
                        {style.name}
                      </div>
                      <div className="text-[10px] text-zinc-600">
                        {style.description}
                      </div>
                    </div>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {style.features.map(feature => (
                      <span
                        key={feature}
                        className={`rounded px-1.5 py-0.5 text-[9px] font-medium ${config.style === style.id ? 'bg-purple-500/10 text-purple-400/80' : 'bg-white/[0.04] text-zinc-600'}`}
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 flex justify-between border-t border-white/[0.04] pt-2 text-[9px] text-zinc-600">
                    <span>Length: {style.estimatedLength}</span>
                    <span>Processing: {style.processingTime}</span>
                  </div>
                </label>
              </div>
            ))}
          </div>
        </RadioGroup>
      </div>

      {/* Content Sections */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
          <FileText className="h-3 w-3" /> Content Sections
        </div>
        <div className="space-y-2">
          {CONTENT_SECTIONS.map(section => (
            <div
              key={section.key}
              className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-white/[0.02] p-3 transition-colors hover:bg-white/[0.04]"
            >
              <div className="flex items-center gap-2.5">
                <div className="rounded-lg bg-white/[0.05] p-1.5 text-zinc-500">
                  {section.icon}
                </div>
                <div>
                  <div className="text-xs font-medium text-zinc-300">
                    {section.name}
                  </div>
                  <div className="text-[10px] text-zinc-600">
                    {section.description}
                  </div>
                </div>
              </div>
              <Switch
                checked={
                  config[
                    section.key as keyof DocumentationConfiguration
                  ] as boolean
                }
                onCheckedChange={checked =>
                  handleSectionToggle(section.key, checked)
                }
              />
            </div>
          ))}
        </div>
      </div>

      {/* Custom Instructions */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
          <Lightbulb className="h-3 w-3" /> Custom Instructions
        </div>
        <textarea
          placeholder="e.g., Focus on security best practices, include performance considerations, use a formal tone..."
          value={config.customPrompt}
          onChange={e => onChange({ customPrompt: e.target.value })}
          rows={3}
          className="w-full resize-none rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 text-xs text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-white/[0.12]"
        />
        <p className="text-[10px] text-zinc-600">
          These instructions will be included in the AI prompt to customize the
          documentation style.
        </p>
      </div>

      {/* Preview */}
      <div className="space-y-2 rounded-xl border border-white/[0.04] bg-white/[0.02] p-3">
        <div className="text-xs font-medium text-zinc-400">
          📋 Table of Contents Preview
        </div>
        <div className="ml-3 space-y-0.5 text-[11px] text-zinc-600">
          <div>1. Project Overview</div>
          {config.includeSetupInstructions && (
            <div>2. Installation & Setup</div>
          )}
          {config.includeCodeExamples && <div>3. Quick Start Guide</div>}
          {config.includeApiDocs && <div>4. API Reference</div>}
          {config.includeArchitecture && <div>5. Architecture</div>}
          {config.includeCodeExamples && <div>6. Examples</div>}
          {config.includeTroubleshooting && <div>7. Troubleshooting</div>}
          <div>8. Contributing</div>
        </div>
      </div>
    </div>
  );
}
