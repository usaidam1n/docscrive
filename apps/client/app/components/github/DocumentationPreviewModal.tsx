'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Download,
  Copy,
  Eye,
  Code,
  CheckCircle,
  Clock,
  Hash,
  X,
  Maximize2,
  Minimize2,
  ExternalLink,
} from 'lucide-react';
import type { GeneratedDocumentation } from '../../../types/documentation';
import 'highlight.js/styles/github-dark.css';

interface DocumentationPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentation: GeneratedDocumentation;
}

export function DocumentationPreviewModal({
  isOpen,
  onClose,
  documentation,
}: DocumentationPreviewModalProps) {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    'preview' | 'raw' | 'sections' | 'metadata'
  >('preview');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleCopyToClipboard = async (content: string, sectionId?: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedSection(sectionId || 'full');
      setTimeout(() => setCopiedSection(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([documentation.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${documentation.repositoryId}-documentation.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatProcessingTime = (ms: number) => {
    const seconds = Math.round(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const tabs = [
    { id: 'preview', icon: Eye, label: 'Preview' },
    { id: 'raw', icon: Code, label: 'Raw Output' },
    { id: 'sections', icon: Hash, label: 'JSON Sections' },
    { id: 'metadata', icon: Clock, label: 'Telemetry' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-[0_0_100px_rgba(255,255,255,0.02)] ${
              isFullscreen ? 'h-[98vh] w-[98vw]' : 'h-[85vh] w-full max-w-6xl'
            }`}
          >
            {/* Header */}
            <div className="flex flex-shrink-0 items-center justify-between border-b border-white/5 bg-white/[0.02] px-6 py-5">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-purple-500/20 bg-purple-500/10 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                  <FileText className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-xl font-medium tracking-tight text-zinc-100">
                    Documentation Review
                  </h2>
                  <div className="mt-1 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                    <span>{documentation.repositoryId}</span>
                    <span className="h-1 w-1 rounded-full bg-zinc-700" />
                    <span>
                      {new Date(
                        documentation.metadata.generatedAt
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="hidden text-zinc-400 hover:bg-white/5 hover:text-zinc-100 sm:flex"
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </Button>
                <div className="mx-1 hidden h-4 w-[1px] bg-white/10 sm:block" />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="text-zinc-400 hover:bg-red-500/10 hover:text-red-400"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-shrink-0 flex-col gap-4 border-b border-white/5 bg-[#0a0a0a] px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex space-x-1 rounded-lg border border-white/5 bg-white/[0.03] p-1">
                {tabs.map(tab => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`relative flex items-center gap-2 rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                        isActive
                          ? 'text-zinc-100'
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeTabIndicatorPreview"
                          className="absolute inset-0 rounded-md border border-white/5 bg-white/10"
                          transition={{
                            type: 'spring',
                            bounce: 0.2,
                            duration: 0.6,
                          }}
                        />
                      )}
                      <tab.icon className="relative z-10 h-4 w-4" />
                      <span className="relative z-10 hidden sm:inline">
                        {tab.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyToClipboard(documentation.content)}
                  className="flex items-center gap-2 border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white"
                >
                  {copiedSection === 'full' ? (
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copiedSection === 'full' ? 'Copied' : 'Copy Output'}
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleDownload}
                  className="flex items-center gap-2 bg-zinc-100 text-black shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:bg-white"
                >
                  <Download className="h-4 w-4" />
                  Download .md
                </Button>
              </div>
            </div>

            {/* Content Area */}
            <div className="workspace-scrollbar relative flex-1 overflow-y-auto bg-[#050505] p-6 md:p-10">
              {activeTab === 'preview' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mx-auto max-w-4xl"
                >
                  <article
                    className="prose prose-invert prose-headings:font-medium 
                    prose-headings:tracking-tight prose-headings:text-zinc-100
                    prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl
                    prose-p:leading-relaxed prose-p:text-zinc-400 prose-a:text-purple-400
                    prose-a:no-underline hover:prose-a:underline prose-blockquote:my-6
                    prose-blockquote:rounded-r-lg prose-blockquote:border-l-2
                    prose-blockquote:border-purple-500/50 prose-blockquote:bg-purple-500/5 prose-blockquote:px-5 prose-blockquote:py-2 prose-blockquote:not-italic prose-blockquote:text-zinc-400 prose-strong:font-semibold prose-strong:text-zinc-200 prose-code:rounded-md prose-code:border prose-code:border-purple-500/20 prose-code:bg-purple-500/10
                    prose-code:px-1.5 prose-code:py-0.5 prose-code:font-mono
                    prose-code:text-[13px] prose-code:font-normal
                    prose-code:text-purple-300
                    prose-code:before:content-none prose-code:after:content-none
                    prose-pre:m-0 prose-pre:bg-transparent prose-pre:p-0 prose-ol:text-zinc-400 prose-ul:text-zinc-400 prose-li:marker:text-zinc-600 prose-hr:my-10 prose-hr:border-white/10 max-w-none"
                  >
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeHighlight, rehypeRaw]}
                      components={{
                        // Code blocks with sleek macOS inspired title bar
                        pre: ({ node, ...props }) => (
                          <div className="relative my-8 overflow-hidden rounded-xl border border-white/10 bg-[#0d0d0d] shadow-2xl">
                            <div className="flex items-center justify-between border-b border-white/5 bg-[#111] px-4 py-3">
                              <div className="flex space-x-2">
                                <div className="h-3 w-3 rounded-full border border-[#e0443e] bg-[#ff5f56]" />
                                <div className="h-3 w-3 rounded-full border border-[#dea123] bg-[#ffbd2e]" />
                                <div className="h-3 w-3 rounded-full border border-[#1aab29] bg-[#27c93f]" />
                              </div>
                              <div className="font-mono text-[10px] uppercase tracking-widest text-zinc-600">
                                Code Snippet
                              </div>
                            </div>
                            <div className="overflow-x-auto p-5 text-[13px] leading-loose selection:bg-purple-500/30">
                              <pre {...props} />
                            </div>
                          </div>
                        ),
                        // Tables
                        table: ({ node, ...props }) => (
                          <div className="my-8 w-full overflow-y-auto rounded-xl border border-white/10 bg-[#0a0a0a]">
                            <table
                              className="w-full text-left align-middle text-sm"
                              {...props}
                            />
                          </div>
                        ),
                        th: ({ node, ...props }) => (
                          <th
                            className="border-b border-white/10 bg-white/5 px-4 py-3 font-medium text-zinc-300"
                            {...props}
                          />
                        ),
                        td: ({ node, ...props }) => (
                          <td
                            className="border-b border-white/5 px-4 py-3 text-zinc-400 last:border-0"
                            {...props}
                          />
                        ),
                        // Links
                        a: ({ node, ...props }) => (
                          <a
                            className="inline-flex items-center gap-1 font-medium text-purple-400 transition-colors hover:text-purple-300"
                            target="_blank"
                            rel="noopener noreferrer"
                            {...props}
                          >
                            {props.children}
                            <ExternalLink className="h-3 w-3 opacity-70" />
                          </a>
                        ),
                        // Images
                        img: ({ node, ...props }) => (
                          <img
                            className="my-8 rounded-xl border border-white/10 object-cover shadow-xl"
                            {...props}
                          />
                        ),
                      }}
                    >
                      {documentation.content}
                    </ReactMarkdown>
                  </article>
                </motion.div>
              )}

              {activeTab === 'raw' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mx-auto h-full max-w-5xl"
                >
                  <div className="relative flex h-full min-h-[400px] flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0d0d0d] shadow-2xl">
                    <div className="flex shrink-0 items-center justify-between border-b border-white/5 bg-[#111] px-4 py-3">
                      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                        <Code className="h-3 w-3" /> Raw Markdown Output
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleCopyToClipboard(documentation.content, 'raw')
                        }
                        className="h-7 border border-white/5 bg-white/5 text-xs text-zinc-400 hover:bg-white/10 hover:text-zinc-100"
                      >
                        {copiedSection === 'raw' ? (
                          <CheckCircle className="mr-1.5 h-3 w-3 text-emerald-400" />
                        ) : (
                          <Copy className="mr-1.5 h-3 w-3" />
                        )}
                        Copy Raw
                      </Button>
                    </div>
                    <div className="workspace-scrollbar flex-1 overflow-auto p-5">
                      <pre className="whitespace-pre-wrap break-words font-mono text-[13px] leading-relaxed text-zinc-300">
                        {documentation.content}
                      </pre>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'sections' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mx-auto max-w-4xl space-y-6 pb-10"
                >
                  {documentation.sections.map((section, idx) => (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      key={section.id}
                      className="overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0a] shadow-lg transition-all hover:border-white/20"
                    >
                      <div className="bg-white-[0.02] flex items-center justify-between border-b border-white/5 px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Badge
                            variant="outline"
                            className="border-white/10 bg-white/5 font-mono text-[10px] uppercase tracking-widest text-zinc-300"
                          >
                            {section.type}
                          </Badge>
                          <h3 className="font-medium text-zinc-100">
                            {section.title}
                          </h3>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-100"
                          onClick={() =>
                            handleCopyToClipboard(section.content, section.id)
                          }
                        >
                          {copiedSection === section.id ? (
                            <CheckCircle className="h-4 w-4 text-emerald-400" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <div className="bg-black/20 p-5">
                        <pre className="workspace-scrollbar max-h-[400px] overflow-auto rounded-lg border border-white/5 bg-[#0d0d0d] p-5 font-mono text-[13px] leading-relaxed text-zinc-400">
                          {section.content}
                        </pre>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {activeTab === 'metadata' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mx-auto grid max-w-5xl gap-6 pb-10 lg:grid-cols-2"
                >
                  <div className="space-y-6">
                    {/* Generative Stats */}
                    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a] p-6 shadow-xl sm:p-8">
                      <div className="pointer-events-none absolute right-0 top-0 -mr-10 -mt-10 h-32 w-32 rounded-full bg-purple-500/5 blur-3xl" />
                      <h3 className="mb-6 flex items-center gap-2 font-medium text-zinc-100">
                        <div className="rounded-lg border border-orange-500/20 bg-orange-500/10 p-2">
                          <Clock className="h-4 w-4 text-orange-400" />
                        </div>
                        Telemetry Overview
                      </h3>
                      <div className="space-y-4 text-sm">
                        <div className="flex items-center justify-between border-b border-white/5 pb-3">
                          <span className="text-zinc-500">Timestamp</span>
                          <span className="font-mono text-xs text-zinc-300">
                            {new Date(
                              documentation.metadata.generatedAt
                            ).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between border-b border-white/5 pb-3">
                          <span className="text-zinc-500">
                            Pipeline Duration
                          </span>
                          <span className="font-mono text-xs text-orange-400 text-zinc-300">
                            {formatProcessingTime(
                              documentation.metadata.processingTime
                            )}
                          </span>
                        </div>
                        <div className="flex items-center justify-between border-b border-white/5 pb-3">
                          <span className="text-zinc-500">Tokens Eaten</span>
                          <span className="font-mono text-xs text-zinc-300">
                            {documentation.metadata.tokenUsage.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-500">
                            Source Files Analyzed
                          </span>
                          <span className="font-mono text-xs text-zinc-300">
                            {documentation.metadata.fileCount}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Content Metrics */}
                    <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-6 shadow-xl sm:p-8">
                      <h3 className="mb-6 flex items-center gap-2 font-medium text-zinc-100">
                        <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-2">
                          <FileText className="h-4 w-4 text-blue-400" />
                        </div>
                        Artifact Metrics
                      </h3>
                      <div className="space-y-4 text-sm">
                        <div className="flex items-center justify-between border-b border-white/5 pb-3">
                          <span className="text-zinc-500">Character Size</span>
                          <span className="font-mono text-xs text-zinc-300">
                            {documentation.content.length.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between border-b border-white/5 pb-3">
                          <span className="text-zinc-500">Word Count</span>
                          <span className="font-mono text-xs text-zinc-300">
                            {documentation.content
                              .split(/\s+/)
                              .length.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-500">Line Count</span>
                          <span className="font-mono text-xs text-zinc-300">
                            {documentation.content
                              .split('\n')
                              .length.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Settings Snapshot */}
                    <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-6 shadow-xl sm:p-8">
                      <h3 className="mb-6 flex items-center gap-2 font-medium text-zinc-100">
                        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2">
                          <Hash className="h-4 w-4 text-emerald-400" />
                        </div>
                        Configuration Profile
                      </h3>
                      <div className="space-y-4 text-sm">
                        <div className="flex items-center justify-between border-b border-white/5 pb-3">
                          <span className="text-zinc-500">
                            Documentation Style
                          </span>
                          <Badge
                            variant="outline"
                            className="border-white/10 bg-white/5 font-normal text-zinc-300"
                          >
                            {documentation.configuration.style}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between border-b border-white/5 pb-3">
                          <span className="text-zinc-500">Output Format</span>
                          <span className="font-mono text-[10px] uppercase tracking-widest text-emerald-400">
                            {documentation.configuration.format}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-500">Architecture</span>
                          <span className="font-medium capitalize text-zinc-300">
                            {documentation.configuration.structure.replace(
                              '-',
                              ' '
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {documentation.metadata.warnings.length > 0 && (
                      <div className="relative overflow-hidden rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-6 shadow-xl sm:p-8">
                        <div className="pointer-events-none absolute right-0 top-0 -mr-10 -mt-10 h-32 w-32 rounded-full bg-yellow-500/10 blur-3xl" />
                        <h3 className="mb-4 flex items-center gap-2 font-semibold text-yellow-500">
                          <div className="rounded bg-yellow-500/20 p-1">
                            <div className="h-2 w-2 animate-pulse rounded-full bg-yellow-400" />
                          </div>
                          Diagnostics
                        </h3>
                        <ul className="list-inside list-disc space-y-2 font-mono text-[11px] text-sm uppercase tracking-wider text-yellow-200/70">
                          {documentation.metadata.warnings.map(
                            (warning, index) => (
                              <li key={index}>{warning}</li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
