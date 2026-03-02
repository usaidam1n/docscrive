'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Play,
  Download,
  Eye,
  FileText,
  CheckCircle,
  AlertTriangle,
  Clock,
  ArrowLeft,
  Settings,
  XCircle,
  Cpu,
  RefreshCw,
} from 'lucide-react';
import { DocumentationPreviewModal } from './DocumentationPreviewModal';
import type { GitHubRepository } from '../../../types/github';
import type {
  DocumentationConfiguration,
  DocumentationProgress,
  GeneratedDocumentation,
} from '../../../types/documentation';
import { getApiKey } from '../../../utils/storage';
import { generateDocument } from '../../../utils/api';
import { updateConfigSuccess } from '../../../utils/github-config-storage';

interface DocumentationGeneratorProps {
  repository: GitHubRepository;
  configuration: DocumentationConfiguration;
  onBack: () => void;
  onBackToRepository?: () => void;
  onComplete: (documentation: GeneratedDocumentation) => void;
}

export function DocumentationGenerator({
  repository,
  configuration,
  onBack,
  onBackToRepository,
  onComplete,
}: DocumentationGeneratorProps) {
  const [progress, setProgress] = useState<DocumentationProgress>({
    id: '',
    status: 'authenticating',
    progress: 0,
    currentStep: 'Idle',
    processedFiles: 0,
    totalFiles: configuration.maxTotalFiles || 0,
    startedAt: null as any,
    warnings: [],
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDocs, setGeneratedDocs] =
    useState<GeneratedDocumentation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([
    `> System initialized for ${repository.full_name}`,
  ]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, isGenerating]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isGenerating && progress.startedAt) {
      timer = setInterval(() => {
        setElapsedTime(
          Math.floor(
            (Date.now() - new Date(progress.startedAt).getTime()) / 1000
          )
        );
        setProgress(prev => {
          if (prev.status === 'generating' && prev.progress < 95) {
            const increment =
              prev.progress > 80 ? 0.2 : prev.progress > 50 ? 0.5 : 1;
            return { ...prev, progress: prev.progress + increment };
          }
          return prev;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isGenerating, progress.startedAt, progress.status]);

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toISOString().substring(11, 19); // HH:MM:SS
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  }, []);

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const startGeneration = useCallback(async () => {
    setIsGenerating(true);
    setError(null);
    setLogs([]);
    setElapsedTime(0);
    setGeneratedDocs(null);

    const generationId = `doc_${Date.now()}`;
    const startTimeStr = new Date().toISOString();

    try {
      setProgress({
        id: generationId,
        status: 'authenticating',
        progress: 10,
        currentStep: 'Validating Environment',
        processedFiles: 0,
        totalFiles: configuration.maxTotalFiles,
        startedAt: startTimeStr,
        warnings: [],
      });

      addLog(`Initializing AI Build Pipeline (v2.0)`);
      addLog(`Repository: ${repository.full_name}`);
      addLog(`Model Matrix: ${configuration.aiModel}`);

      const apiKey = getApiKey();
      if (!apiKey) {
        throw new Error(
          'Missing API Key config. Please update your workspace settings.'
        );
      }
      await delay(800);

      setProgress(prev => ({
        ...prev,
        status: 'fetching',
        progress: 25,
        currentStep: 'Analyzing Source Code',
      }));
      addLog(
        `Ingesting file tree... (max: ${configuration.maxTotalFiles} nodes)`
      );
      addLog(
        `Filters APPLIED: ${configuration.includePatterns.length} includes, ${configuration.excludePatterns.length} excludes`
      );
      await delay(800);

      setProgress(prev => ({
        ...prev,
        status: 'generating',
        progress: 40,
        currentStep: 'Generating Documentation',
      }));
      addLog(`Compiling conceptual structures...`);
      addLog(`Handing off to context engine (${configuration.aiModel})`);

      const result = await generateDocument({
        githubUrl: repository.clone_url,
        apiKey: apiKey,
        selectedModel: {
          key: configuration.aiModel.includes('gpt')
            ? 'openai'
            : configuration.aiModel.includes('claude')
              ? 'anthropic'
              : 'google',
          value: configuration.aiModel,
        },
        repository: {
          id: repository.id,
          name: repository.name,
          full_name: repository.full_name,
          description: repository.description,
          private: repository.private,
          language: repository.language,
          size: repository.size,
          default_branch: repository.default_branch,
          owner: repository.owner,
        },
        configuration: {
          ...configuration, // Spread full config
          format: configuration.format,
          structure: configuration.structure,
        },
      });

      if (result.error && !result.document) {
        throw new Error(
          result.message ||
            result.error ||
            'Documentation generation failed gracefully.'
        );
      }
      if (!result.document || result.document.trim().length === 0) {
        throw new Error(
          'Pipeline completed but returned empty artifact output.'
        );
      }

      const totalTimeMs = Date.now() - new Date(startTimeStr).getTime();
      const finalFileCount =
        result.metadata?.processing?.processedFiles ||
        configuration.maxTotalFiles;

      setProgress(prev => ({
        ...prev,
        status: 'completed',
        progress: 100,
        currentStep: 'Build Succeeded',
        completedAt: new Date().toISOString(),
        processedFiles: finalFileCount,
      }));

      addLog(`Artifact generation successful.`);
      addLog(
        `Tokens processed: ${result.metadata?.processing?.tokenUsage?.toLocaleString() || 'N/A'}`
      );
      addLog(`Build completed in ${(totalTimeMs / 1000).toFixed(1)}s`);

      setGeneratedDocs({
        id: generationId,
        repositoryId: repository.id.toString(),
        configuration,
        content: result.document,
        metadata: {
          generatedAt: result.metadata?.generatedAt || new Date().toISOString(),
          processingTime: totalTimeMs,
          tokenUsage: result.metadata?.processing?.tokenUsage || 0,
          fileCount: finalFileCount,
          warnings: result.metadata?.warnings || [],
        },
        sections: result.sections || [
          {
            id: 'main',
            title: 'Generated Documentation',
            content: result.document,
            type: 'overview',
            order: 1,
          },
        ],
      });

      if (configuration && 'id' in configuration) {
        updateConfigSuccess((configuration as any).id, true);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown pipeline error';
      setError(errorMessage);
      addLog(`ERROR: ${errorMessage}`);
      setProgress(prev => ({
        ...prev,
        status: 'failed',
        currentStep: 'Build Failed',
      }));

      if (configuration && 'id' in configuration) {
        updateConfigSuccess((configuration as any).id, false);
      }
    } finally {
      setIsGenerating(false);
    }
  }, [repository, configuration, onComplete]);

  const handleDownloadDocumentation = useCallback(async () => {
    if (!generatedDocs) return;
    try {
      addLog(`Preparing artifact compression...`);
      const { downloadDocumentation, getDownloadInfo } = await import(
        '../../lib/enhanced-download-utils'
      );

      const downloadOptions = {
        content: generatedDocs.content,
        // @ts-ignore Let it map strictly
        format: configuration.format,
        structure: configuration.structure as
          | 'single-file'
          | 'hierarchical'
          | 'modular',
        projectName: repository.name,
        metadata: generatedDocs.metadata,
      };

      const result = await downloadDocumentation(downloadOptions);
      addLog(
        `Ejected artifact: ${result.filename} (${(result.size / 1024).toFixed(1)}KB)`
      );
    } catch (error) {
      addLog(
        `Artifact ejection failed: ${error instanceof Error ? error.message : 'Unknown IO error'}`
      );
    }
  }, [generatedDocs, configuration, repository.name]);

  const abortGeneration = () => {
    setIsGenerating(false);
    addLog('User aborted pipeline.');
    setProgress(prev => ({
      ...prev,
      status: 'failed',
      currentStep: 'Aborted',
    }));
  };

  const circleRadius = 45;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset =
    circleCircumference -
    (Math.min(100, Math.max(0, progress.progress)) / 100) * circleCircumference;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 space-y-6 duration-500">
      {/* Top Header Controls */}
      <div className="hook-glow flex flex-col items-start justify-between gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-xl font-medium tracking-tight text-zinc-100">
              {repository.name}
            </h2>
            <Badge
              variant="outline"
              className={`\${ progress.status === 'completed' ?
                'text-emerald-400 border-emerald-400/30' : progress.status === 'failed' ? 
                'text-red-400 border-red-400/30' : isGenerating ? 'text-purple-400 animate-pulse' 
                : 'text-zinc-500 border-zinc-700' } border-purple-400/30 bg-black/40 text-[10px] uppercase
              tracking-widest`}
            >
              {progress.status === 'authenticating'
                ? 'Initializing'
                : progress.status === 'fetching'
                  ? 'Analyzing'
                  : progress.status === 'generating'
                    ? 'Inferencing'
                    : progress.status === 'completed'
                      ? 'Success'
                      : progress.status === 'failed'
                        ? 'Failed'
                        : 'Idle'}
            </Badge>
          </div>
          <p className="mt-1 truncate text-sm text-zinc-500">
            {isGenerating
              ? progress.currentStep
              : progress.status === 'completed'
                ? 'Documentation cleanly generated.'
                : 'Launch the build pipeline to generate docs.'}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <Button
            variant="ghost"
            onClick={onBack}
            disabled={isGenerating}
            size="sm"
            className="text-zinc-400 hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Config
          </Button>

          {!isGenerating && progress.status !== 'completed' && (
            <Button
              onClick={startGeneration}
              size="sm"
              className="bg-white text-black hover:bg-zinc-200"
            >
              <Play className="mr-2 h-4 w-4 fill-current" /> Initialize Build
            </Button>
          )}

          {isGenerating && (
            <Button
              onClick={abortGeneration}
              size="sm"
              className="border border-red-500/20 bg-red-500/10 text-red-500 hover:bg-red-500/20"
            >
              <XCircle className="mr-2 h-4 w-4" /> Abort Build
            </Button>
          )}

          {progress.status === 'completed' && (
            <>
              <Button
                onClick={() => setShowPreviewModal(true)}
                variant="outline"
                size="sm"
                className="border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05]"
              >
                <Eye className="mr-2 h-4 w-4" /> Inspect
              </Button>
              <Button
                onClick={handleDownloadDocumentation}
                size="sm"
                className="border-none bg-purple-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.3)] hover:bg-purple-700"
              >
                <Download className="mr-2 h-4 w-4" /> Eject Artifact
              </Button>
            </>
          )}

          {progress.status === 'failed' && (
            <Button
              onClick={startGeneration}
              size="sm"
              className="bg-zinc-800 text-white hover:bg-zinc-700"
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Retry
            </Button>
          )}
        </div>
      </div>

      {/* Main Grid View */}
      <div className="relative grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Glow backdrop behind active Grid */}
        {isGenerating && (
          <div className="pointer-events-none absolute inset-0 z-0 bg-purple-500/5 blur-[100px] transition-opacity duration-1000" />
        )}

        {/* Left Column: Diagnostics & Context */}
        <div className="z-10 flex flex-col gap-6 lg:col-span-4">
          {/* Circular Progress Hero */}
          <div className="relative flex flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 backdrop-blur-xl">
            <div className="relative flex h-32 w-32 items-center justify-center">
              {/* Background Track */}
              <svg
                className="absolute inset-0 h-full w-full -rotate-90 transform"
                viewBox="0 0 100 100"
              >
                <circle
                  cx="50"
                  cy="50"
                  r={circleRadius}
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="transparent"
                  className="text-white/5"
                />
                {/* Progress Line */}
                <circle
                  cx="50"
                  cy="50"
                  r={circleRadius}
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="transparent"
                  strokeDasharray={circleCircumference}
                  strokeDashoffset={strokeDashoffset}
                  className={`\${ progress.status === 'completed'
                      ? 'text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]' : progress.status === 'failed' ? 
                      'text-red-500' : 'text-purple-500 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]' } shadow-emerald-500/50
                      transition-all duration-1000
                    ease-out`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="relative text-center">
                <span className="text-3xl font-light tracking-tighter text-white">
                  {Math.round(progress.progress)}
                  <span className="text-xl text-zinc-500">%</span>
                </span>
              </div>
            </div>
            <p className="mt-6 h-5 text-center text-sm font-medium uppercase tracking-widest text-zinc-300">
              {isGenerating
                ? 'Active Build'
                : progress.status === 'completed'
                  ? 'Completed'
                  : 'Standby'}
            </p>
          </div>

          {/* Telemetry Stats */}
          <div className="flex flex-col gap-[1px] overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.06]">
            {/* Model Used */}
            <div className="flex items-center gap-4 bg-[#0a0a0a] p-4 text-sm transition-colors hover:bg-[#0f0f0f]">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/[0.05]">
                <Cpu className="h-4 w-4 text-zinc-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs text-zinc-500">Inference Engine</div>
                <div className="mt-0.5 truncate font-medium text-zinc-200">
                  {configuration.aiModel}
                </div>
              </div>
            </div>

            {/* Elapsed Time */}
            <div className="flex items-center gap-4 bg-[#0a0a0a] p-4 text-sm transition-colors hover:bg-[#0f0f0f]">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/[0.05]">
                <Clock className="h-4 w-4 text-zinc-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs text-zinc-500">Elapsed Time</div>
                <div className="mt-0.5 font-mono text-zinc-200">
                  {elapsedTime}s
                </div>
              </div>
            </div>

            {/* Scope / Files */}
            <div className="flex items-center gap-4 bg-[#0a0a0a] p-4 text-sm transition-colors hover:bg-[#0f0f0f]">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/[0.05]">
                <FileText className="h-4 w-4 text-zinc-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs text-zinc-500">Target Scope Limit</div>
                <div className="mt-0.5 text-zinc-200">
                  {configuration.maxTotalFiles} Files
                </div>
              </div>
            </div>

            {/* Success Metrics Overlay */}
            {progress.status === 'completed' && generatedDocs && (
              <div className="flex items-center gap-4 border-t border-emerald-900/30 bg-[#0f1f14] p-4 text-sm">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-emerald-500">Tokens Handled</div>
                  <div className="mt-0.5 font-mono text-emerald-300">
                    {generatedDocs.metadata.tokenUsage?.toLocaleString() ||
                      '---'}{' '}
                    tkns
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Console Log */}
        <div className="z-10 flex h-[500px] flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0a0a0a] shadow-2xl lg:col-span-8">
          {/* Fake Window Header */}
          <div className="flex items-center border-b border-white/[0.06] bg-[#0f0f0f] px-4 py-3">
            <div className="mr-4 flex gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-zinc-800" />
              <div className="h-2.5 w-2.5 rounded-full bg-zinc-800" />
              <div className="h-2.5 w-2.5 rounded-full bg-zinc-800" />
            </div>
            <div className="flex-1 text-center font-mono text-[11px] tracking-wider text-zinc-500">
              logstream :: docscrive_build
            </div>
          </div>

          {/* Scrollable Output */}
          <div className="workspace-scrollbar relative flex-1 overflow-y-auto p-6 font-mono text-xs leading-relaxed tracking-tight text-zinc-300 sm:text-sm">
            <div className="space-y-1">
              {logs.map((log, i) => {
                const isError = log.includes('ERROR');
                const isSuccess =
                  log.includes('successful') || log.includes('Ejected');
                return (
                  <div
                    key={i}
                    className={`\${isError ? 'text-red-400' : isSuccess ? 'text-emerald-400' : 'text-zinc-400'} py-0.5 font-mono`}
                  >
                    {log}
                  </div>
                );
              })}
              {isGenerating && (
                <div className="mt-2 flex items-center gap-2 text-zinc-600">
                  <span className="animate-pulse">_</span>
                </div>
              )}
              <div ref={logsEndRef} />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <div className="grid">
            <span className="font-semibold text-red-300">Pipeline Crash</span>
            <span className="leading-relaxed opacity-90">{error}</span>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {generatedDocs && (
        <DocumentationPreviewModal
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          documentation={generatedDocs}
        />
      )}
    </div>
  );
}
