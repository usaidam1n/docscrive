import React from 'react';
import { motion } from 'framer-motion';
import { Check, Star, Zap, Shield, ArrowRight, Users } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Pricing - DocScrive',
  description: 'Simple, transparent pricing for AI-powered code documentation.',
};

const tiers = [
  {
    name: 'Hobby',
    price: '$0',
    description: 'Perfect for indie hackers and open-source contributors.',
    features: [
      '1 GitHub repository sync',
      'Bring Your Own Key (BYOK)',
      'Standard Markdown export',
      'Basic caching',
      'Up to 50 files per generation',
    ],
    cta: 'Get Started for Free',
    href: '/document-your-code',
    icon: <Star className="h-5 w-5 text-zinc-400" />,
    popular: false,
    theme: 'zinc',
  },
  {
    name: 'Pro',
    price: '$19',
    period: '/month',
    description: 'For power users who need high-volume, automated access.',
    features: [
      'Unlimited GitHub repositories',
      'DocScrive Managed AI Tokens',
      'Access to advanced models (GPT-4o, Claude 3.5)',
      'Architecture diagrams & API Refs',
      'Continuous Sync (Push to main)',
      'Up to 500 files per codebase',
    ],
    cta: 'Upgrade to Pro',
    href: '/document-your-code',
    icon: <Zap className="h-5 w-5 text-[#2ecc71]" />,
    popular: true,
    theme: 'green',
  },
  {
    name: 'Team',
    price: '$49',
    period: '/user/month',
    description: 'Ideal for agencies and scale-ups managing complex projects.',
    features: [
      'Everything in Pro',
      'Shared team workspaces',
      'Centralized billing',
      'Custom brand stylesheets',
      'Direct Notion API sync',
      'High-concurrency processing',
    ],
    cta: 'Start Team Trial',
    href: '/contact',
    icon: <Users className="h-5 w-5 text-purple-400" />,
    popular: false,
    theme: 'purple',
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'Maximum security and isolation for large organizations.',
    features: [
      'SOC2 / HIPAA Compliance readiness',
      'Air-gapped VPC deployment',
      'Zero Data Retention guarantee',
      'Custom fine-tuned AI models',
      'Dedicated Account Manager',
      'Enterprise SLA guarantees',
    ],
    cta: 'Contact Sales',
    href: '/contact',
    icon: <Shield className="h-5 w-5 text-amber-400" />,
    popular: false,
    theme: 'amber',
  },
];

import Navbar from '../components/NavBar';
import Footer from '../components/Footer';

export default function PricingPage() {
  const visibleTiers = tiers.filter(tier => tier.name !== 'Enterprise');

  return (
    <>
      <Navbar />
      <div className="relative min-h-screen overflow-hidden bg-[#030303] px-4 pb-24 pt-32 text-white sm:px-6 lg:px-8">
        {/* Background Ornaments */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[500px]">
          <div className="absolute inset-0 bg-gradient-to-b from-[#2ecc71]/10 to-transparent" />
          <div className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-[#2ecc71]/10 blur-[120px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <h1 className="mb-6 text-4xl font-extrabold tracking-tight sm:text-5xl">
              Simple, Transparent Pricing
            </h1>
            <p className="text-lg text-zinc-400">
              Scale your productivity with AI-generated documentation that stays
              in perfect sync with your codebase. No hidden fees, cancel
              anytime.
            </p>
          </div>

          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3 xl:gap-8">
            {visibleTiers.map((tier, index) => (
              <div
                key={tier.name}
                className={`relative flex flex-col rounded-2xl border p-6 backdrop-blur-xl lg:p-8 ${
                  tier.popular
                    ? 'border-[#2ecc71]/30 bg-[#0a0a0c]/80 shadow-[0_0_40px_rgba(46,204,113,0.1)]'
                    : 'border-white/[0.08] bg-[#0a0a0c]/60 hover:border-white/[0.15]'
                } transition-all duration-300`}
              >
                {tier.popular && (
                  <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
                    <span className="rounded-full bg-gradient-to-r from-[#2ecc71] to-[#27ae60] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-black shadow-[0_0_15px_rgba(46,204,113,0.3)]">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03]`}
                    >
                      {tier.icon}
                    </div>
                    <h3 className="text-lg font-semibold text-white">
                      {tier.name}
                    </h3>
                  </div>

                  <div className="mb-2 flex items-baseline gap-1">
                    <span className="text-4xl font-bold tracking-tight text-white">
                      {tier.price}
                    </span>
                    {tier.period && (
                      <span className="text-sm font-medium text-zinc-400">
                        {tier.period}
                      </span>
                    )}
                  </div>

                  <p className="min-h-[40px] text-sm text-zinc-400">
                    {tier.description}
                  </p>
                </div>

                <div className="mb-6 h-px w-full bg-white/[0.06]" />

                <ul className="mb-8 flex-1 space-y-4">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#2ecc71]/10">
                        <Check className="h-3 w-3 text-[#2ecc71]" />
                      </div>
                      <span className="text-sm text-zinc-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={tier.href}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                    tier.popular
                      ? 'bg-gradient-to-r from-[#2ecc71] to-[#27ae60] text-black shadow-[0_0_20px_rgba(46,204,113,0.2)] hover:scale-[1.02] hover:from-[#27ae60] hover:to-[#219a52] hover:shadow-[0_0_30px_rgba(46,204,113,0.3)] active:scale-[0.98]'
                      : 'border border-white/[0.06] bg-white/[0.04] text-white hover:border-white/[0.1] hover:bg-white/[0.08]'
                  }`}
                >
                  {tier.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
