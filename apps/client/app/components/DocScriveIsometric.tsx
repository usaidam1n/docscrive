'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  FolderGit2,
  GitBranch,
  Shield,
} from 'lucide-react';

const activityLines = [
  '[sync] Pulling repository tree...',
  '[ast] Mapping modules and dependencies...',
  '[docs] Building architecture.md',
  '[docs] Building api-reference.md',
  '[export] Packaging Markdown + PDF',
];

const docCards = [
  { title: 'Architecture', format: 'Markdown', status: 'Ready' },
  { title: 'API Reference', format: 'Markdown', status: 'Ready' },
  { title: 'Setup Guide', format: 'PDF', status: 'Ready' },
];

export default function DocScriveIsometric() {
  return (
    <div className="relative mx-auto w-full max-w-6xl px-2 sm:px-0">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 h-72 w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/20 blur-[120px]" />
        <div className="absolute left-1/2 top-1/2 h-80 w-full -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(circle_at_center,rgba(46,204,113,0.12),transparent_60%)]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#070b09]/90 shadow-[0_24px_90px_rgba(0,0,0,0.65)]"
      >
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.35)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.35)_1px,transparent_1px)] [background-size:20px_20px]" />
        <motion.div
          aria-hidden
          className="via-emerald-300/8 pointer-events-none absolute -left-1/4 top-0 h-full w-1/2 bg-gradient-to-r from-transparent to-transparent"
          animate={{ x: ['-40%', '220%'] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'linear' }}
        />

        <div className="relative grid gap-4 p-4 md:grid-cols-5 md:gap-5 md:p-6">
          <div className="rounded-2xl border border-white/10 bg-black/35 p-4 md:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/35 bg-emerald-500/10 px-3 py-1">
                <FolderGit2 className="h-3.5 w-3.5 text-emerald-300" />
                <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-emerald-200">
                  Repository Input
                </span>
              </div>
              <span className="font-mono text-[10px] text-zinc-500">
                private
              </span>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#050806] p-3">
              <div className="mb-2 flex items-center gap-2 text-xs text-zinc-300">
                <GitBranch className="h-3.5 w-3.5 text-emerald-300" />
                <span className="font-mono">johndoe/docscrive</span>
              </div>
              <div className="flex flex-wrap gap-2 font-mono text-[10px]">
                {['main', 'src/', 'app/', 'components/', 'types/'].map(tag => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-zinc-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-4 space-y-1.5 rounded-xl border border-white/10 bg-[#050806] p-3 font-mono text-[10px] text-zinc-400">
              {activityLines.map((line, i) => (
                <motion.div
                  key={line}
                  initial={{ opacity: 0.35 }}
                  animate={{ opacity: [0.35, 1, 0.35] }}
                  transition={{
                    duration: 2.6,
                    repeat: Infinity,
                    delay: i * 0.22,
                  }}
                  className={
                    i === activityLines.length - 1 ? 'text-emerald-300' : ''
                  }
                >
                  {line}
                </motion.div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/35 p-4 md:col-span-3">
            <div className="mb-4 flex items-center justify-between">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1">
                <FileText className="h-3.5 w-3.5 text-zinc-300" />
                <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-zinc-300">
                  Generated Documentation
                </span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-500/10 px-2.5 py-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
                <span className="font-mono text-[10px] text-emerald-200">
                  In Sync
                </span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {docCards.map((card, idx) => (
                <motion.div
                  key={card.title}
                  className="rounded-xl border border-white/10 bg-[#050806] p-3"
                  initial={{ opacity: 0.8, y: 4 }}
                  animate={{ opacity: [0.8, 1, 0.8], y: [4, 0, 4] }}
                  transition={{
                    duration: 3.2,
                    repeat: Infinity,
                    delay: idx * 0.3,
                  }}
                >
                  <div className="mb-2 h-1.5 w-16 rounded-full bg-emerald-300/45" />
                  <div className="text-sm font-medium text-zinc-200">
                    {card.title}
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {card.format}
                  </div>
                  <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-300/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-medium text-emerald-300">
                    <CheckCircle2 className="h-3 w-3" />
                    {card.status}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-[#050806] p-3">
              <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.08em] text-zinc-500">
                Sample Output
              </div>
              <div className="space-y-2 font-mono text-[10px] text-zinc-400">
                <div># Authentication Architecture</div>
                <div className="text-zinc-500">## Request Flow</div>
                <div className="text-emerald-300">
                  - Middleware validates JWT token
                </div>
                <div>- Session manager resolves user context</div>
                <div>- Route guards enforce role access</div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative border-t border-white/10 bg-black/35 px-4 py-3 md:px-6">
          <div className="flex flex-col gap-2 text-[11px] text-zinc-400 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
              DocScrive pipeline active
              <ArrowRight className="h-3.5 w-3.5 text-zinc-600" />
              Last run: 12s ago
            </div>
            <div className="text-zinc-500">
              Markdown, PDF, architecture maps, API references
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
