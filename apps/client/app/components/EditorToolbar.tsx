import React from 'react';
import { Button } from './ui/button';
import { Settings, Play, Sparkles, ChevronDown } from 'lucide-react';
import { useSettingsModal, useApiSettings } from './providers/SettingsProvider';
import { modelOptions } from '../../utils/utils';
import { cn } from '@/lib/utils';

interface EditorToolbarProps {
  onGenerate: () => void;
  isGenerating: boolean;
  disabled?: boolean;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  onGenerate,
  isGenerating,
  disabled,
}) => {
  const { openModal } = useSettingsModal();
  const { selectedModel } = useApiSettings();

  const currentModelLabel =
    modelOptions.find(option => option.key === selectedModel.key)?.label ||
    'Select Model';

  return (
    <div className="flex items-center gap-2">
      {/* Model Selector Pill */}
      <button
        onClick={() => openModal()}
        className="group flex h-8 items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.04] px-3 text-xs font-medium text-zinc-400 transition-all duration-200 hover:border-white/[0.1] hover:bg-white/[0.06] hover:text-zinc-200"
      >
        <Sparkles className="h-3 w-3 text-purple-400 group-hover:text-purple-300" />
        <span className="max-w-[100px] truncate">{currentModelLabel}</span>
        <ChevronDown className="h-3 w-3 opacity-50" />
      </button>

      {/* Settings */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => openModal()}
        className="h-8 w-8 rounded-lg p-0 text-zinc-500 transition-colors hover:bg-white/[0.05] hover:text-white"
      >
        <Settings className="h-3.5 w-3.5" />
      </Button>

      {/* Divider */}
      <div className="h-5 w-px bg-white/[0.06]" />

      {/* Generate Button — Premium CTA */}
      <Button
        onClick={onGenerate}
        disabled={disabled || isGenerating}
        size="sm"
        className={cn(
          'group relative h-9 gap-2 overflow-hidden rounded-xl px-5 text-sm font-semibold transition-all duration-300',
          isGenerating
            ? 'border border-white/[0.06] bg-white/[0.05] text-zinc-400'
            : disabled
              ? 'cursor-not-allowed border border-white/[0.04] bg-white/[0.03] text-zinc-600'
              : 'bg-gradient-to-r from-[#2ecc71] to-[#27ae60] text-black shadow-[0_0_20px_rgba(46,204,113,0.2)] hover:scale-[1.02] hover:from-[#27ae60] hover:to-[#219a52] hover:shadow-[0_0_30px_rgba(46,204,113,0.3)] active:scale-[0.98]'
        )}
      >
        {/* Shimmer effect */}
        {!isGenerating && !disabled && (
          <span className="pointer-events-none absolute inset-0 h-full w-full -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent group-hover:animate-[shimmer_2s_infinite]" />
        )}
        {isGenerating ? (
          <>
            <div className="relative z-10 h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" />
            <span className="relative z-10">Generating...</span>
          </>
        ) : (
          <>
            <Play className="relative z-10 h-3.5 w-3.5 fill-current" />
            <span className="relative z-10">Generate</span>
          </>
        )}
      </Button>
    </div>
  );
};
