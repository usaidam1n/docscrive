'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Code,
  GitBranch,
  ArrowLeft,
  ChevronRight,
  Sparkles,
  Settings,
  Github,
  Brain,
  Globe,
  Zap,
  FileText,
  Check,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import Navbar from '../components/NavBar';
import Footer from '../components/Footer';
import Dashboard from '../components/Dashboard';
import { MeshGradientBackground } from '../components/ui/MeshGradientBackground';

// GitHub Components
import { RepositorySelector } from '../components/github/RepositorySelector';
import { DocumentationConfig } from '../components/github/DocumentationConfig';
import { DocumentationGenerator } from '../components/github/DocumentationGenerator';
import { useSettingsModal } from '../components/providers/SettingsProvider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { LogOut } from 'lucide-react';
import { useGitHubAuth } from '../components/providers/GitHubAuthProvider';
import { ErrorBoundary } from '../components/ErrorBoundary';
import type { GitHubRepository } from '../../types/github';
import type { DocumentationConfiguration } from '../../types/documentation';

// Template selection types
type DocumentationType = 'selection' | 'basic' | 'github';

interface DocumentationTemplate {
  id: string;
  type: DocumentationType;
  title: string;
  description: string;
  features: string[];
  icon: React.ReactNode;
  recommended?: boolean;
  comingSoon?: boolean;
}

// Breadcrumb component
const Breadcrumb: React.FC<{
  items: Array<{ label: string; onClick?: () => void; active?: boolean }>;
}> = ({ items }) => {
  return (
    <nav className="mb-12 flex items-center space-x-2 text-sm font-medium text-zinc-500">
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && <ChevronRight className="h-4 w-4 opacity-50" />}
          <button
            onClick={item.onClick}
            className={`transition-colors hover:text-white ${
              item.active ? 'text-white' : ''
            } ${item.onClick ? 'cursor-pointer rounded-md px-2 py-1 hover:bg-white/10' : 'cursor-default'}`}
            disabled={!item.onClick}
          >
            {item.label}
          </button>
        </React.Fragment>
      ))}
    </nav>
  );
};

// Template selection card component
const TemplateCard: React.FC<{
  template: DocumentationTemplate;
  onSelect: () => void;
  delay?: number;
}> = ({ template, onSelect, delay = 0 }) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      setMousePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4, scale: 1.01 }}
      className="relative h-full"
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onClick={!template.comingSoon ? onSelect : undefined}
        className={`group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-950 shadow-xl transition-all duration-500 hover:border-white/20 ${
          template.comingSoon ? 'cursor-not-allowed opacity-60' : ''
        }`}
      >
        <div
          className="pointer-events-none absolute -inset-px rounded-[2rem] opacity-0 mix-blend-screen transition duration-500 group-hover:opacity-100"
          style={{
            background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,255,255,0.06), transparent 40%)`,
          }}
        />

        <div className="relative z-10 flex h-full flex-col overflow-hidden p-8 md:p-10">
          {template.recommended && (
            <div className="absolute right-6 top-6 z-20">
              <span className="relative inline-flex items-center overflow-hidden rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                <span className="absolute inset-0 -translate-x-full animate-[shimmer_2.5s_infinite] bg-gradient-to-r from-transparent via-emerald-400/20 to-transparent" />
                <Sparkles className="relative z-10 mr-1.5 h-3 w-3" />
                <span className="relative z-10">Recommended</span>
              </span>
            </div>
          )}

          {template.comingSoon && (
            <div className="absolute right-6 top-6 z-20">
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Coming Soon
              </span>
            </div>
          )}

          <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-300 shadow-inner transition-colors duration-500 group-hover:bg-white/10 group-hover:text-white">
            {template.icon}
          </div>

          <h3 className="mb-3 text-2xl font-medium tracking-tight text-white">
            {template.title}
          </h3>
          <p className="mb-8 flex-grow text-base font-normal leading-relaxed text-zinc-400">
            {template.description}
          </p>

          <div className="mt-auto space-y-6">
            <div className="h-px w-full bg-white/5" />
            <ul className="space-y-4">
              {template.features.map((feature, index) => (
                <li
                  key={index}
                  className="flex items-center gap-3 text-zinc-300"
                >
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/20 text-emerald-400">
                    <Check className="h-3 w-3" />
                  </div>
                  <span className="text-sm font-medium tracking-tight">
                    {feature}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative z-20 mt-10">
            <Button
              className={`group h-12 w-full rounded-full text-base font-semibold transition-all duration-300 ${template.recommended ? 'bg-white text-black hover:scale-[1.02] hover:bg-zinc-100' : 'border border-white/10 bg-white/5 text-white hover:scale-[1.02] hover:bg-white/10'}`}
              disabled={template.comingSoon}
            >
              {template.recommended && (
                <span className="blend-overlay absolute inset-0 -translate-x-full animate-[shimmer_2.5s_infinite] bg-gradient-to-r from-transparent via-black/5 to-transparent" />
              )}
              <span className="relative z-10 flex items-center justify-center">
                {template.comingSoon ? 'Coming Soon' : 'Get Started'}
                {!template.comingSoon && (
                  <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                )}
              </span>
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Main page component
export default function DocumentYourCodePage() {
  const [selectedTemplate, setSelectedTemplate] =
    useState<DocumentationType>('selection');
  const [sampleInitialData] = useState({ document: '' });

  // GitHub-specific state
  const { isAuthenticated, user, login, logout, error, isLoading } =
    useGitHubAuth();
  const [selectedRepository, setSelectedRepository] =
    useState<GitHubRepository | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [documentationConfig, setDocumentationConfig] =
    useState<DocumentationConfiguration | null>(null);

  const { openModal } = useSettingsModal();

  // Handle GitHub OAuth redirect
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('flow') === 'github') {
        setSelectedTemplate('github');
        // Clean up URL parameters
        window.history.replaceState({}, '', '/document-your-code');
      }
    }
  }, []);

  // Template definitions
  const templates: DocumentationTemplate[] = [
    {
      id: 'basic',
      type: 'basic',
      title: 'Quick Snippets',
      description:
        'Perfect for individual functions, scripts, or small components. Paste code and get an instant deep-dive breakdown.',
      features: [
        'Instant AI logic mapping',
        'Support for 40+ languages',
        'Markdown & PDF Export',
        'Real-time render preview',
      ],
      icon: <Code className="h-8 w-8" />,
      recommended: true,
    },
    {
      id: 'github',
      type: 'github',
      title: 'Repository Sync',
      description:
        'Connect directly to GitHub. We map your entire architecture, dependencies, and complex component trees.',
      features: [
        'Full AST repository parsing',
        'Intelligent ignore filtering',
        'Architectural diagram generation',
        'Automated API references',
      ],
      icon: <GitBranch className="h-8 w-8" />,
    },
    {
      id: 'enterprise',
      type: 'selection',
      title: 'Enterprise Suite',
      description:
        'Custom CI/CD pipelines, advanced SOC2 security, and team-wide collaborative editing namespaces.',
      features: [
        'Team collaboration RBAC',
        'Custom brand stylesheets',
        'Pipeline webhooks',
        'Priority SLA support',
      ],
      icon: <Globe className="h-8 w-8" />,
      comingSoon: true,
    },
  ];

  // GitHub steps definition (completed state from current step)
  const githubSteps = [
    {
      id: 'select-repo',
      title: 'Select Repository',
      description: 'Choose target repository',
      icon: <GitBranch className="h-5 w-5" />,
      completed: currentStep > 0,
    },
    {
      id: 'configure',
      title: 'Configure Parsing',
      description: 'Set logic mapping priorities',
      icon: <Settings className="h-5 w-5" />,
      completed: currentStep > 1,
    },
    {
      id: 'generate',
      title: 'Generate Docs',
      description: 'Compile AI architecture',
      icon: <FileText className="h-5 w-5" />,
      completed: currentStep > 2,
    },
  ];

  // Navigation handlers
  const handleBackToSelection = () => {
    setSelectedTemplate('selection');
    // Reset GitHub state
    setSelectedRepository(null);
    setCurrentStep(0);
    setDocumentationConfig(null);
  };

  const handleTemplateSelect = (templateType: DocumentationType) => {
    setSelectedTemplate(templateType);
  };

  // GitHub handlers
  const handleRepositorySelect = (repository: GitHubRepository) => {
    setSelectedRepository(repository);
    if (currentStep === 0) {
      setCurrentStep(1);
    }
  };

  const handleNextStep = () => {
    if (currentStep < githubSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleBackToRepositorySelection = () => {
    setCurrentStep(0);
  };

  // Breadcrumb items
  const getBreadcrumbItems = () => {
    const items = [
      {
        label: 'Workspace',
        onClick: handleBackToSelection,
        active: selectedTemplate === 'selection',
      },
    ];

    if (selectedTemplate === 'basic') {
      items.push({
        label: 'Quick Snippets',
        onClick: () => {},
        active: true,
      });
    } else if (selectedTemplate === 'github') {
      items.push({
        label: 'Repository Integration',
        onClick: () => {},
        active: true,
      });

      if (currentStep > 0) {
        items.push({
          label: githubSteps[currentStep].title,
          onClick: () => {},
          active: true,
        });
      }
    }

    return items;
  };

  // Render template selection
  if (selectedTemplate === 'selection') {
    return (
      <div className="min-h-screen bg-black selection:bg-purple-500/30 selection:text-white">
        <MeshGradientBackground />
        <Navbar />

        <div className="container relative z-10 flex w-full flex-col items-center py-24">
          {/* Header */}
          <motion.div
            className="mb-20 w-full max-w-4xl text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="mb-6 inline-flex items-center space-x-2 rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm text-zinc-300 shadow-sm backdrop-blur-md">
              <span className="relative mr-1 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-purple-500"></span>
              </span>
              <span className="font-medium tracking-wide">
                AI-Powered Generation
              </span>
            </div>

            <h1 className="mb-6 text-5xl font-medium leading-[1.1] tracking-tighter text-white md:text-6xl lg:text-7xl">
              Select your <br />
              <span className="bg-gradient-to-r from-zinc-100 via-zinc-400 to-zinc-600 bg-clip-text text-transparent">
                workflow.
              </span>
            </h1>

            <p className="mx-auto max-w-2xl text-lg font-normal leading-relaxed text-zinc-400 md:text-xl">
              Choose how you want to connect your logic to DocScrive's core.
              Whether it's a small script or a monorepo, we adapt.
            </p>
          </motion.div>

          {/* Template Grid */}
          <div className="mx-auto grid w-full max-w-7xl gap-6 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template, index) => (
              <TemplateCard
                key={template.id}
                template={template}
                onSelect={() => handleTemplateSelect(template.type)}
                delay={index * 0.15}
              />
            ))}
          </div>

          {/* Bottom CTA */}
          <motion.div
            className="relative mt-24 w-full max-w-4xl overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-950 p-12 text-center shadow-2xl"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="absolute inset-0 z-0 bg-gradient-to-tr from-purple-500/5 to-blue-500/5" />
            <div className="relative z-10">
              <h3 className="mb-4 text-3xl font-medium tracking-tight text-white md:text-4xl">
                Unsure where to begin?
              </h3>
              <p className="mx-auto mb-10 max-w-2xl text-lg font-normal text-zinc-400">
                Start with the Quick Snippets module to immediately experience
                the AI engine. You can upgrade to Repository Sync later.
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button
                  size="lg"
                  onClick={() => handleTemplateSelect('basic')}
                  className="group relative h-14 overflow-hidden rounded-full bg-white px-8 text-base font-semibold text-black shadow-[0_0_40px_rgba(255,255,255,0.1)] transition-all hover:scale-105 hover:bg-zinc-100"
                >
                  <span className="blend-overlay absolute inset-0 -translate-x-full animate-[shimmer_2.5s_infinite] bg-gradient-to-r from-transparent via-black/5 to-transparent" />
                  <Zap className="relative z-10 mr-2 h-4 w-4 text-amber-500" />
                  <span className="relative z-10 tracking-tight">
                    Launch Quick Snippets
                  </span>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => handleTemplateSelect('github')}
                  className="group h-14 rounded-full border-white/10 bg-white/5 px-8 text-base font-medium text-white backdrop-blur-md transition-all hover:bg-white/10"
                >
                  <Github className="mr-2 h-4 w-4" />
                  Connect GitHub
                </Button>
              </div>
            </div>
          </motion.div>
        </div>

        <Footer />
      </div>
    );
  }

  // Render basic documentation template — Full Screen AI Code Studio
  if (selectedTemplate === 'basic') {
    return (
      <div className="flex h-screen flex-col overflow-hidden bg-[#0a0b0e] selection:bg-[#2ecc71]/30 selection:text-white">
        {/* Minimal Workspace Top Bar */}
        <div className="z-50 flex shrink-0 items-center justify-between border-b border-white/[0.04] bg-[#0a0b0e]/95 px-5 py-3 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackToSelection}
              className="group flex items-center gap-2 text-sm font-medium text-zinc-500 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              <span>Back</span>
            </button>
            <div className="h-4 w-px bg-white/[0.06]" />
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#2ecc71]/20 bg-gradient-to-br from-[#2ecc71]/20 to-[#2ecc71]/5">
                <Code className="h-3.5 w-3.5 text-[#2ecc71]" />
              </div>
              <span className="text-sm font-semibold tracking-tight text-white">
                Quick Snippets
              </span>
              <span className="flex items-center gap-1.5 rounded-md border border-white/[0.06] bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-zinc-500">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#2ecc71]" />
                Studio
              </span>
            </div>
          </div>
        </div>

        {/* Full-bleed workspace */}
        <main className="relative flex-1 overflow-hidden px-4 py-4 lg:px-6">
          <Dashboard initialData={sampleInitialData} />
        </main>
      </div>
    );
  }

  // Render GitHub documentation flow
  if (selectedTemplate === 'github') {
    // Loading state — full-screen dark skeleton
    if (isLoading) {
      return (
        <ErrorBoundary>
          <div className="flex h-screen items-center justify-center bg-[#0a0b0e]">
            <div className="flex flex-col items-center gap-4">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-[#2ecc71]" />
              <span className="text-sm font-medium text-zinc-500">
                Loading workspace...
              </span>
            </div>
          </div>
        </ErrorBoundary>
      );
    }

    // Auth screen — full-screen immersive dark auth card
    if (!isAuthenticated) {
      return (
        <div className="flex h-screen flex-col overflow-hidden bg-[#0a0b0e] selection:bg-[#2ecc71]/30 selection:text-white">
          {/* Minimal top bar */}
          <div className="flex shrink-0 items-center border-b border-white/[0.04] px-5 py-3">
            <button
              onClick={handleBackToSelection}
              className="group flex items-center gap-2 text-sm font-medium text-zinc-500 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              <span>Back</span>
            </button>
          </div>

          <main className="flex flex-1 items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="workspace-glass w-full max-w-md p-10"
            >
              <div className="mb-8 text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.08] to-white/[0.02]">
                  <GitBranch className="h-7 w-7 text-white" />
                </div>
                <h2 className="mb-3 text-2xl font-semibold tracking-tight text-white">
                  Connect GitHub
                </h2>
                <p className="mx-auto max-w-xs text-sm leading-relaxed text-zinc-500">
                  {error
                    ? error
                    : 'Authorize DocScrive to securely index and analyze your repositories.'}
                </p>
              </div>

              {error ? (
                <div className="space-y-4 text-center">
                  <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3">
                    <p className="text-xs font-medium text-red-400">
                      Auth setup required configuration in portal.
                    </p>
                  </div>
                  <button
                    onClick={handleBackToSelection}
                    className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.05] text-sm font-medium text-zinc-300 transition-colors hover:bg-white/[0.08]"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to Templates
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-6 rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
                    <ul className="space-y-2.5 text-sm text-zinc-400">
                      {[
                        'Secure READ-only access',
                        'Deep architecture mapping',
                        'Webhook live sync support',
                      ].map(item => (
                        <li key={item} className="flex items-center gap-2.5">
                          <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#2ecc71]/15 text-[#2ecc71]">
                            <Check className="h-2.5 w-2.5" />
                          </div>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={login}
                      disabled={!!error}
                      className="flex h-11 w-full items-center justify-center gap-2.5 rounded-xl bg-white text-sm font-semibold text-black shadow-[0_0_30px_rgba(255,255,255,0.08)] transition-all hover:scale-[1.01] hover:bg-zinc-100 active:scale-[0.99]"
                    >
                      <Github className="h-4 w-4" />
                      Authorize GitHub
                    </button>
                    <button
                      onClick={handleBackToSelection}
                      className="h-10 rounded-xl text-sm text-zinc-500 transition-colors hover:bg-white/[0.03] hover:text-zinc-300"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </main>
        </div>
      );
    }

    // Authenticated workspace — Full Screen IDE Layout
    return (
      <ErrorBoundary>
        <div className="flex h-screen flex-col overflow-hidden bg-[#09090b] selection:bg-emerald-500/30 selection:text-white">
          {/* Modern workspace top bar */}
          <div className="z-50 flex shrink-0 items-center justify-between border-b border-white/[0.06] bg-[#09090b]/90 px-4 py-3.5 backdrop-blur-2xl md:px-6">
            <div className="flex min-w-0 flex-1 items-center gap-4 md:gap-6">
              <button
                onClick={handleBackToSelection}
                className="group flex shrink-0 items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-white"
              >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                <span className="hidden sm:inline">Back</span>
              </button>

              <div className="flex shrink-0 items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/25 to-teal-500/20 shadow-[0_0_20px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/20">
                  <GitBranch className="h-4 w-4 text-emerald-400" />
                </div>
                <div>
                  <span className="text-sm font-semibold tracking-tight text-white">
                    Repo Sync
                  </span>
                  <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                    <span className="h-1 w-1 animate-pulse rounded-full bg-emerald-400" />
                    Studio
                  </span>
                </div>
              </div>

              {/* Step indicator — horizontal stepper (desktop) */}
              <nav
                className="hidden min-w-0 flex-1 justify-center lg:flex"
                aria-label="Progress"
              >
                <ol className="flex items-center gap-0">
                  {githubSteps.map((step, index) => (
                    <li
                      key={step.id}
                      className="flex items-center"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          if (index < currentStep) {
                            if (index === 0) handleBackToRepositorySelection();
                            else setCurrentStep(index);
                          }
                        }}
                        disabled={index > currentStep}
                        className={`flex items-center gap-2 rounded-xl px-3 py-2 transition-all ${
                          index === currentStep
                            ? 'bg-white/[0.08]'
                            : index < currentStep
                              ? 'cursor-pointer hover:bg-white/[0.05]'
                              : 'cursor-default'
                        }`}
                      >
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-all ${
                            step.completed
                              ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30'
                              : index === currentStep
                                ? 'bg-white text-[#0a0a0b] ring-2 ring-white/50'
                                : 'bg-white/[0.06] text-zinc-500'
                          }`}
                        >
                          {step.completed ? (
                            <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                          ) : (
                            index + 1
                          )}
                        </span>
                        <span
                          className={`hidden text-sm font-medium xl:inline ${
                            index === currentStep
                              ? 'text-white'
                              : step.completed
                                ? 'text-emerald-400/90'
                                : 'text-zinc-500'
                          }`}
                        >
                          {step.title}
                        </span>
                      </button>
                      {index < githubSteps.length - 1 && (
                        <span
                          className={`mx-1 h-px w-6 shrink-0 md:w-8 ${
                            step.completed ? 'bg-emerald-500/40' : 'bg-white/[0.08]'
                          }`}
                        />
                      )}
                    </li>
                  ))}
                </ol>
              </nav>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              {selectedRepository && currentStep > 0 && (
                <div className="hidden items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 sm:flex">
                  <GitBranch className="h-3.5 w-3.5 text-zinc-500" />
                  <span className="max-w-[140px] truncate text-xs font-medium text-zinc-300">
                    {selectedRepository.full_name}
                  </span>
                </div>
              )}

              {user && (
                <div className="flex items-center gap-2 border-l border-white/[0.06] pl-3">
                  <button
                    onClick={() => openModal()}
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-white"
                    title="AI Configuration"
                  >
                    <Settings className="h-4 w-4" />
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="relative h-9 w-9 overflow-hidden rounded-xl border border-white/[0.08] ring-0 transition-all hover:border-emerald-500/30 hover:ring-2 hover:ring-emerald-500/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:ring-offset-2 focus:ring-offset-[#09090b]">
                        <img
                          src={user.avatar_url}
                          alt={user.name || user.login}
                          className="h-full w-full object-cover"
                        />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-56 rounded-xl border-white/10 bg-[#0f0f12] text-white shadow-2xl"
                    >
                      <DropdownMenuLabel className="p-3 font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none text-white">
                            {user.name || user.login}
                          </p>
                          <p className="text-xs leading-none text-zinc-500">
                            @{user.login}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-white/5" />
                      <DropdownMenuItem
                        className="cursor-pointer p-3 text-red-400 transition-colors focus:bg-red-500/10 focus:text-red-300"
                        onClick={async () => {
                          await logout();
                          handleBackToSelection();
                        }}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Sign Out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          </div>

          {/* Mobile step pills (visible when desktop stepper is hidden) */}
          <div className="flex justify-center gap-2 border-b border-white/[0.04] bg-[#09090b]/80 px-4 py-2 backdrop-blur-sm lg:hidden">
            {githubSteps.map((step, index) => (
              <span
                key={step.id}
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                  index === currentStep
                    ? 'bg-white text-[#09090b]'
                    : step.completed
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-white/[0.08] text-zinc-500'
                }`}
              >
                {step.completed ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : index + 1}
              </span>
            ))}
          </div>

          {/* Main Content — fills remaining viewport */}
          <main className="relative flex-1 overflow-auto px-4 py-5 lg:px-6">
            <AnimatePresence mode="wait" custom={currentStep}>
              {currentStep === 0 && (
                <motion.div
                  key="step0"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="mx-auto h-full w-full max-w-5xl space-y-5"
                >
                  {selectedRepository && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 sm:flex-row sm:items-center"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/15 text-emerald-400 shadow-[0_0_24px_rgba(16,185,129,0.12)] ring-1 ring-emerald-500/20">
                          <GitBranch className="h-6 w-6" />
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-base font-semibold tracking-tight text-white">
                            {selectedRepository.full_name}
                          </div>
                          <div className="mt-0.5 max-w-md truncate text-sm text-zinc-500">
                            {selectedRepository.description ||
                              'No description provided'}
                          </div>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <Badge
                          variant="default"
                          className={
                            selectedRepository.private
                              ? 'border border-amber-500/20 bg-amber-500/10 text-xs text-amber-400 shadow-none'
                              : 'border border-emerald-500/20 bg-emerald-500/10 text-xs text-emerald-400 shadow-none'
                          }
                        >
                          {selectedRepository.private ? 'Private' : 'Public'}
                        </Badge>
                        <button
                          onClick={handleNextStep}
                          className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 text-sm font-semibold text-white shadow-[0_0_24px_rgba(16,185,129,0.25)] transition-all hover:shadow-[0_0_32px_rgba(16,185,129,0.35)] hover:brightness-110 active:scale-[0.98]"
                        >
                          Start Indexing
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </motion.div>
                  )}

                  <div className="flex-1 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6">
                    <RepositorySelector
                      onRepositorySelect={handleRepositorySelect}
                      selectedRepository={selectedRepository}
                    />
                  </div>
                </motion.div>
              )}

              {currentStep === 1 && selectedRepository && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="mx-auto w-full max-w-5xl"
                >
                  <DocumentationConfig
                    repository={selectedRepository}
                    onConfigurationChange={config => {
                      setDocumentationConfig(config);
                    }}
                    onNext={handleNextStep}
                    onBack={handleBackToRepositorySelection}
                    isLoading={false}
                  />
                </motion.div>
              )}

              {currentStep === 2 &&
                selectedRepository &&
                documentationConfig && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="mx-auto w-full max-w-5xl"
                  >
                    <DocumentationGenerator
                      repository={selectedRepository}
                      configuration={documentationConfig}
                      onBack={handlePreviousStep}
                      onBackToRepository={handleBackToRepositorySelection}
                      onComplete={docs => {
                        console.log('Documentation generated:', docs);
                      }}
                    />
                  </motion.div>
                )}
            </AnimatePresence>
          </main>
        </div>
      </ErrorBoundary>
    );
  }

  return null;
}
