'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import {
  Filter,
  Download,
  Palette,
  Settings,
  Eye,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

import { FileFilterConfig } from './FileFilterConfig';
import { DocumentationStyleConfig } from './DocumentationStyleConfig';
import { OutputConfig } from './OutputConfig';
import { AdvancedConfig } from './AdvancedConfig';
import { ConfigurationPreview } from './ConfigurationPreview';

import type { GitHubRepository } from '../../../types/github';
import type {
  DocumentationConfiguration,
  ConfigurationValidation,
} from '../../../types/documentation';

interface AdvancedConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: DocumentationConfiguration;
  onChange: (updates: Partial<DocumentationConfiguration>) => void;
  repository: GitHubRepository;
  validation: ConfigurationValidation;
}

const TABS = [
  {
    id: 'filters',
    label: 'File Filtering',
    icon: <Filter className="h-4 w-4" />,
  },
  {
    id: 'output',
    label: 'Output Structure',
    icon: <Download className="h-4 w-4" />,
  },
  {
    id: 'style',
    label: 'Documentation Details',
    icon: <Palette className="h-4 w-4" />,
  },
  {
    id: 'ai',
    label: 'AI Generation Settings',
    icon: <Settings className="h-4 w-4" />,
  },
  {
    id: 'summary',
    label: 'Configuration Summary',
    icon: <Eye className="h-4 w-4" />,
  },
];

export function AdvancedConfigModal({
  open,
  onOpenChange,
  config,
  onChange,
  repository,
  validation,
}: AdvancedConfigModalProps) {
  const [activeTab, setActiveTab] = useState('filters');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="workspace-glass max-w-4xl gap-0 overflow-hidden border-white/[0.06] bg-[#0a0b0e] p-0">
        {/* Header */}
        <div className="border-b border-white/[0.06] px-6 py-4">
          <DialogTitle className="flex items-center gap-2 text-base font-semibold text-white">
            <Settings className="h-4 w-4 text-purple-400" />
            Advanced Setup & Customization
          </DialogTitle>
          <DialogDescription className="mt-1 text-xs text-zinc-500">
            Fine-tune how documentation is generated for {repository.full_name}
          </DialogDescription>
        </div>

        {/* Content Layout */}
        <div className="flex h-[65vh] min-h-[500px]">
          {/* Sidebar */}
          <div className="flex w-[240px] shrink-0 flex-col gap-1 border-r border-white/[0.06] bg-white/[0.01] p-3">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-purple-500/10 text-purple-400'
                    : 'text-zinc-500 hover:bg-white/[0.03] hover:text-zinc-300'
                }`}
              >
                {tab.icon}
                {tab.label}
                {/* Status indicator on the summary tab */}
                {tab.id === 'summary' && (
                  <div className="ml-auto">
                    {validation.isValid ? (
                      <CheckCircle className="h-3.5 w-3.5 text-[#2ecc71]/70" />
                    ) : (
                      <AlertTriangle className="h-3.5 w-3.5 text-red-500/70" />
                    )}
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Main Content Area */}
          <div className="workspace-scrollbar flex-1 overflow-y-auto bg-[#0a0b0e] p-6">
            {activeTab === 'filters' && (
              <div className="animate-in fade-in zoom-in-95 duration-200">
                <FileFilterConfig
                  config={config}
                  onChange={onChange}
                  repository={repository}
                />
              </div>
            )}

            {activeTab === 'output' && (
              <div className="animate-in fade-in zoom-in-95 duration-200">
                <OutputConfig config={config} onChange={onChange} />
              </div>
            )}

            {activeTab === 'style' && (
              <div className="animate-in fade-in zoom-in-95 duration-200">
                <DocumentationStyleConfig config={config} onChange={onChange} />
              </div>
            )}

            {activeTab === 'ai' && (
              <div className="animate-in fade-in zoom-in-95 duration-200">
                <AdvancedConfig config={config} onChange={onChange} />
              </div>
            )}

            {activeTab === 'summary' && (
              <div className="animate-in fade-in zoom-in-95 duration-200">
                <ConfigurationPreview
                  config={config}
                  repository={repository}
                  validation={validation}
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-white/[0.06] bg-white/[0.01] px-6 py-4">
          <button
            onClick={() => onOpenChange(false)}
            className="h-9 rounded-xl border border-white/[0.06] bg-white/[0.05] px-5 text-xs font-semibold text-white transition-all hover:bg-white/[0.1]"
          >
            Done
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
