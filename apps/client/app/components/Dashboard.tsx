'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GeneratedDocument from './GeneratedDocument';
import MarkdownEditor from './MarkdownEditor';
import FileUpload from './FileUpload';
import {
  Github,
  RotateCcw,
  Code2,
  Sparkles,
  Zap,
  FileCode,
  Terminal,
  Globe,
  Upload,
} from 'lucide-react';
import { checkIfUrlIsValid, isValidInput } from '../../utils/utils';
import Toast from './Toast';
import { generateDocument } from '@/utils/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import {
  useApiSettings,
  useSettingsModal,
  useSettings,
} from './providers/SettingsProvider';
import { useAsyncSubmit } from '../hooks/useAsyncState';
import { EditorToolbar } from './EditorToolbar';
import { cn } from '@/lib/utils';

interface DashboardProps {
  initialData: { document: string };
}

export type { SelectedModel } from './providers/SettingsProvider';

// Animated typing placeholder
const PLACEHOLDER_LINES = [
  'function fibonacci(n) {',
  '  if (n <= 1) return n;',
  '  return fibonacci(n - 1) + fibonacci(n - 2);',
  '}',
];

function TypingPlaceholder() {
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);

  useEffect(() => {
    if (currentLineIndex >= PLACEHOLDER_LINES.length) {
      // Reset after a pause
      const timeout = setTimeout(() => {
        setDisplayedLines([]);
        setCurrentLineIndex(0);
        setCurrentCharIndex(0);
      }, 3000);
      return () => clearTimeout(timeout);
    }

    const currentLine = PLACEHOLDER_LINES[currentLineIndex];
    if (currentCharIndex <= currentLine.length) {
      const timeout = setTimeout(
        () => {
          setDisplayedLines(prev => {
            const lines = [...prev];
            lines[currentLineIndex] = currentLine.slice(0, currentCharIndex);
            return lines;
          });
          setCurrentCharIndex(c => c + 1);
        },
        40 + Math.random() * 30
      );
      return () => clearTimeout(timeout);
    } else {
      setCurrentLineIndex(i => i + 1);
      setCurrentCharIndex(0);
      return undefined;
    }
  }, [currentLineIndex, currentCharIndex]);

  return (
    <div className="pointer-events-none select-none font-mono text-sm leading-relaxed text-zinc-600">
      {displayedLines.map((line, i) => (
        <div key={i} className="flex">
          <span className="mr-4 w-8 text-right text-xs text-zinc-700/40">
            {i + 1}
          </span>
          <span>{line}</span>
          {i === currentLineIndex - 1 ||
          (i === currentLineIndex &&
            currentCharIndex <=
              (PLACEHOLDER_LINES[currentLineIndex]?.length ?? 0))
            ? null
            : null}
        </div>
      ))}
      {currentLineIndex < PLACEHOLDER_LINES.length && (
        <div className="flex">
          <span className="mr-4 w-8 text-right text-xs text-zinc-700/40">
            {displayedLines.length}
          </span>
          <span>{displayedLines[currentLineIndex] || ''}</span>
          <span className="ml-[1px] inline-block h-4 w-[2px] animate-[typing-blink_1s_infinite] bg-[#2ecc71]" />
        </div>
      )}
    </div>
  );
}

export default function Dashboard({
  initialData,
}: DashboardProps): React.ReactNode {
  const [githubUrl, setGithubUrl] = useState('');
  const [textCode, setTextCode] = useState('');
  const [generatedDocument, setGeneratedDocument] = useState(initialData);
  const [activeTab, setActiveTab] = useState<'code' | 'github'>('code');
  const [isMounted, setIsMounted] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { apiKey, selectedModel } = useApiSettings();
  const { isConfigured } = useSettings();
  const { openModal } = useSettingsModal();

  const docGeneration = useAsyncSubmit();

  useEffect(() => setIsMounted(true), []);

  async function handleGenerateDocument(): Promise<void> {
    if (!isConfigured) {
      openModal('Please configure your settings.');
      return;
    }

    const currentGithubUrl = activeTab === 'github' ? githubUrl : '';
    const currentTextCode = activeTab === 'code' ? textCode : '';

    if (
      !isValidInput({ githubUrl: currentGithubUrl, textCode: currentTextCode })
    ) {
      docGeneration.setError('Please provide input in the active tab.');
      return;
    }

    if (currentGithubUrl && !checkIfUrlIsValid(currentGithubUrl)) {
      docGeneration.setError('Please enter a valid GitHub URL.');
      return;
    }

    await docGeneration.submit(
      () =>
        generateDocument({
          basicDocument: true,
          githubUrl: currentGithubUrl,
          textCode: currentTextCode,
          apiKey,
          selectedModel,
        }),
      response => {
        if (response.message) {
          docGeneration.setError(response.message);
          return;
        }
        setGeneratedDocument(response);
      },
      error => {
        console.error('Document generation failed:', error);
      }
    );
  }

  function handleFileChange(text: string) {
    setTextCode(text);
    setActiveTab('code');
  }

  const handleClear = () => {
    setTextCode('');
    setGithubUrl('');
    setGeneratedDocument({ document: '' });
  };

  const hasOutput = !!generatedDocument?.document;
  const hasInput = activeTab === 'code' ? !!textCode : !!githubUrl;
  const showEmptyState = !hasInput && !hasOutput && activeTab === 'code';

  return (
    <div className="relative flex h-full w-full flex-col">
      {docGeneration.error && (
        <Toast
          message={docGeneration.error}
          onClose={() => docGeneration.setError(null)}
        />
      )}

      {/* Integrated Command Bar */}
      <div className="mb-4 flex w-full flex-col items-start justify-between gap-4 px-2 py-3 md:flex-row md:items-center">
        <div className="flex flex-wrap items-center gap-3">
          {/* Tab Switcher — Segmented Control */}
          <div className="flex items-center gap-0.5 rounded-xl border border-white/[0.06] bg-[#0d0e12] p-1">
            <button
              onClick={() => setActiveTab('code')}
              className={cn(
                'flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all duration-200',
                activeTab === 'code'
                  ? 'bg-white/[0.08] text-white shadow-sm'
                  : 'text-zinc-500 hover:bg-white/[0.03] hover:text-zinc-300'
              )}
            >
              <Code2 className="h-3.5 w-3.5" />
              Code
            </button>
            <button
              onClick={() => setActiveTab('github')}
              className={cn(
                'flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all duration-200',
                activeTab === 'github'
                  ? 'bg-white/[0.08] text-white shadow-sm'
                  : 'text-zinc-500 hover:bg-white/[0.03] hover:text-zinc-300'
              )}
            >
              <Github className="h-3.5 w-3.5" />
              GitHub URL
            </button>
          </div>

          {/* Divider */}
          <div className="h-5 w-px bg-white/[0.06]" />

          {/* File Upload Trigger (inline) */}
          <FileUpload handleFileChange={handleFileChange} />
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 md:w-auto">
          {/* Clear button */}
          {hasInput && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-8 gap-1.5 rounded-lg px-3 text-xs font-medium text-zinc-500 transition-colors hover:bg-white/[0.05] hover:text-white"
              >
                <RotateCcw className="h-3 w-3" />
                Clear
              </Button>
            </motion.div>
          )}

          {/* Divider */}
          <div className="h-5 w-px bg-white/[0.06]" />

          {/* Editor Toolbar (model + generate) */}
          <EditorToolbar
            onGenerate={handleGenerateDocument}
            isGenerating={docGeneration.loading}
            disabled={!hasInput}
          />
        </div>
      </div>

      {/* Main Workspace Area */}
      <div
        className={cn(
          'flex flex-1 flex-col gap-4 overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] lg:flex-row',
          !hasOutput && 'justify-center'
        )}
      >
        {/* === INPUT PANEL === */}
        <motion.div
          layout
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            'flex flex-col overflow-hidden transition-all duration-500',
            hasOutput
              ? 'h-1/2 w-full lg:h-full lg:w-1/2'
              : 'h-full w-full max-w-5xl',
            isInputFocused
              ? 'workspace-glass workspace-glass-focus'
              : 'workspace-glass'
          )}
        >
          {/* Editor Header */}
          <div className="flex items-center justify-between border-b border-white/[0.04] px-4 py-2.5">
            <div className="flex items-center gap-3">
              {/* Fake traffic lights */}
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]/80" />
                <div className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]/80" />
                <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]/80" />
              </div>
              <div className="h-3.5 w-px bg-white/[0.06]" />
              <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                {activeTab === 'code' ? 'Input' : 'Source'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {activeTab === 'code' && textCode && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="font-mono text-[10px] text-zinc-600"
                >
                  {textCode.split('\n').length} lines
                </motion.span>
              )}
            </div>
          </div>

          {/* Editor Body */}
          <div className="relative flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              {activeTab === 'code' ? (
                <motion.div
                  key="code-tab"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="absolute inset-0 flex flex-col"
                >
                  {/* Code textarea with line numbers gutter */}
                  <div className="relative flex-1 font-mono text-sm">
                    {/* Line number gutter */}
                    <div className="pointer-events-none absolute bottom-0 left-0 top-0 z-0 w-12 border-r border-white/[0.04] bg-white/[0.01]" />

                    {/* Empty State Overlay */}
                    {showEmptyState && (
                      <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center">
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className="mb-8 text-center"
                        >
                          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#2ecc71]/20 bg-gradient-to-br from-[#2ecc71]/20 to-[#2ecc71]/5">
                            <Terminal className="h-6 w-6 text-[#2ecc71]" />
                          </div>
                          <h3 className="mb-2 text-lg font-semibold tracking-tight text-zinc-300">
                            Paste code, drop a file, or enter a GitHub URL
                          </h3>
                          <p className="max-w-md text-sm text-zinc-600">
                            DocScrive will analyze your code and generate
                            comprehensive documentation instantly
                          </p>
                        </motion.div>

                        {/* Feature Pills */}
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.4 }}
                          className="flex items-center gap-3"
                        >
                          {[
                            {
                              icon: <Globe className="h-3 w-3" />,
                              label: '40+ Languages',
                            },
                            {
                              icon: <Zap className="h-3 w-3" />,
                              label: 'Instant AI Analysis',
                            },
                            {
                              icon: <FileCode className="h-3 w-3" />,
                              label: 'Export Anywhere',
                            },
                          ].map(pill => (
                            <span
                              key={pill.label}
                              className="flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-[11px] font-medium text-zinc-500"
                            >
                              {pill.icon}
                              {pill.label}
                            </span>
                          ))}
                        </motion.div>

                        {/* Animated typing demo */}
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.7 }}
                          className="mt-8 w-full max-w-md rounded-xl border border-white/[0.04] bg-white/[0.02] p-5"
                        >
                          <TypingPlaceholder />
                        </motion.div>
                      </div>
                    )}

                    <Textarea
                      ref={textareaRef}
                      placeholder=""
                      value={textCode}
                      onChange={e => setTextCode(e.target.value)}
                      onFocus={() => setIsInputFocused(true)}
                      onBlur={() => setIsInputFocused(false)}
                      className="workspace-scrollbar absolute relative inset-0 z-10 h-full w-full resize-none rounded-none border-0 bg-transparent py-5 pl-16 pr-6 leading-relaxed text-zinc-200 selection:bg-[#2ecc71]/20 placeholder:text-zinc-700 focus-visible:ring-0"
                      spellCheck={false}
                    />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="github-tab"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="absolute inset-0 flex items-center justify-center p-8"
                >
                  <div className="w-full max-w-lg space-y-6 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.08] to-white/[0.02]">
                      <Github className="h-7 w-7 text-white" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold tracking-tight text-white">
                        Import from GitHub
                      </h3>
                      <p className="mx-auto max-w-sm text-sm leading-relaxed text-zinc-500">
                        Paste the URL of any public GitHub file to analyze
                      </p>
                    </div>
                    <div className="relative">
                      <Input
                        id="github-url"
                        type="text"
                        placeholder="https://github.com/owner/repo/blob/main/file.js"
                        value={githubUrl}
                        onChange={e => setGithubUrl(e.target.value)}
                        onFocus={() => setIsInputFocused(true)}
                        onBlur={() => setIsInputFocused(false)}
                        className="h-12 rounded-xl border-white/[0.08] bg-white/[0.03] px-4 font-mono text-sm text-white transition-all placeholder:text-zinc-600 focus:border-[#2ecc71]/30 focus-visible:ring-1 focus-visible:ring-[#2ecc71]/50"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* === OUTPUT PANEL === */}
        <AnimatePresence>
          {hasOutput && (
            <motion.div
              initial={{ opacity: 0, x: 40, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.98 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="workspace-glass flex h-1/2 w-full flex-col overflow-hidden lg:h-full lg:w-1/2"
            >
              <GeneratedDocument
                isTranslationPage={false}
                content={generatedDocument?.document}
              >
                <MarkdownEditor
                  isTranslationPage={false}
                  initialData={{ content: generatedDocument?.document }}
                />
              </GeneratedDocument>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
