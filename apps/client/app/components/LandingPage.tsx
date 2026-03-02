'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  Github,
  Shield,
  Sparkles,
} from 'lucide-react';
import Navbar from './NavBar';
import Footer from './Footer';
import { Button } from './ui/button';
import DocScriveIsometric from './DocScriveIsometric';

const startupSignals = [
  'GitHub-native',
  'Private repo support',
  'Markdown + PDF output',
  'AST-aware docs',
];

const workflowSteps = [
  {
    step: '01',
    title: 'Connect Repository',
    description:
      'Point DocScrive at your GitHub repo. We ingest structure, files, and dependencies with private-safe handling.',
  },
  {
    step: '02',
    title: 'Analyze Codebase',
    description:
      'AST-level analysis maps modules, routes, and relationships so your docs reflect real architecture, not guesses.',
  },
  {
    step: '03',
    title: 'Ship Documentation',
    description:
      'Generate technical documentation in Markdown and PDF for onboarding, handoffs, and investor-ready engineering clarity.',
  },
];

const guarantees = [
  'Built specifically for GitHub repository documentation',
  'No bloated multi-tool workflow, just one focused pipeline',
  'Clear output structure for startup teams moving fast',
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#050705] text-white selection:bg-emerald-400/30 selection:text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(46,204,113,0.16),transparent_40%),radial-gradient(circle_at_80%_10%,rgba(46,204,113,0.1),transparent_38%),radial-gradient(circle_at_50%_80%,rgba(46,204,113,0.08),transparent_45%)]" />
        <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.7)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.7)_1px,transparent_1px)] [background-size:28px_28px]" />
      </div>

      <Navbar />

      <main>
        <section
          id="product"
          className="relative scroll-mt-28 px-4 pb-16 pt-32 md:pt-36"
        >
          <div className="container mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="mx-auto max-w-4xl text-center"
            >
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-200">
                <Github className="h-3.5 w-3.5" />
                Technical Docs for GitHub Repos
              </div>

              <h1 className="text-5xl font-semibold leading-[1.02] tracking-tight text-white md:text-7xl">
                GitHub repos in.
                <br />
                <span className="text-emerald-300">Technical docs out.</span>
              </h1>

              <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-zinc-300 md:text-xl">
                DocScrive now does one thing exceptionally well: generate
                technical documentation from GitHub repositories for startup
                teams that need speed and engineering quality.
              </p>

              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button
                  asChild
                  className="h-12 rounded-full bg-emerald-400 px-8 text-sm font-semibold text-black hover:bg-emerald-300"
                >
                  <Link href="/document-your-code">
                    Start with GitHub
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-12 rounded-full border-white/20 bg-transparent px-8 text-sm font-semibold text-white hover:bg-white/5"
                >
                  <Link href="/#workflow">See workflow</Link>
                </Button>
              </div>
            </motion.div>

            <div className="mt-14">
              <DocScriveIsometric />
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
              {startupSignals.map(signal => (
                <span
                  key={signal}
                  className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-300"
                >
                  {signal}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section
          id="workflow"
          className="scroll-mt-28 border-t border-white/10 px-4 py-20"
        >
          <div className="container mx-auto max-w-6xl">
            <div className="mb-12 max-w-2xl">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">
                Workflow
              </p>
              <h2 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">
                Built for teams that ship fast and document clearly.
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {workflowSteps.map((item, idx) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: idx * 0.08 }}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
                >
                  <div className="mb-6 inline-flex h-9 w-9 items-center justify-center rounded-full border border-emerald-300/30 bg-emerald-500/10 text-sm font-semibold text-emerald-200">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-medium text-white">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                    {item.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="security"
          className="scroll-mt-28 border-t border-white/10 px-4 py-20"
        >
          <div className="container mx-auto grid max-w-6xl gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">
                Why This Version
              </p>
              <h2 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">
                A tight scope with a better experience.
              </h2>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-zinc-400">
                We stripped the product down to the highest-leverage use case.
                The result is a cleaner workflow, sharper output, and a landing
                page that communicates value in seconds.
              </p>

              <div className="mt-8 space-y-3">
                {guarantees.map(item => (
                  <div
                    key={item}
                    className="flex items-start gap-3 text-sm text-zinc-300"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <div className="rounded-2xl border border-emerald-300/30 bg-emerald-500/10 p-5">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-300/35 bg-black/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-emerald-100">
                  <Shield className="h-3.5 w-3.5" />
                  Security-first
                </div>
                <p className="text-sm leading-relaxed text-emerald-50/90">
                  Your repository context is processed for documentation
                  generation without a noisy product surface. Focus stays on
                  secure, technical output.
                </p>
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-5">
                <div className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-zinc-300">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
                  Clear technical value
                </div>
                <p className="text-sm leading-relaxed text-zinc-400">
                  Turn codebase complexity into clean, reliable technical
                  documentation while keeping your engineering team focused on
                  shipping.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-white/10 px-4 py-20">
          <div className="container mx-auto max-w-5xl">
            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent p-10 text-center md:p-14">
              <h2 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">
                Ready to document your GitHub repo the right way?
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-zinc-300">
                Start with one repository. Generate architecture docs in
                minutes. Share clearer technical context with your team and
                stakeholders.
              </p>
              <div className="mt-9">
                <Button
                  asChild
                  className="h-12 rounded-full bg-emerald-400 px-9 text-sm font-semibold text-black hover:bg-emerald-300"
                >
                  <Link href="/document-your-code">
                    Generate Docs Now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
