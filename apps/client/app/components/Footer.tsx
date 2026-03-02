import Link from 'next/link';
import React from 'react';
import { cn } from '../theme-config';

export default function Footer() {
  return (
    <footer className="relative z-10 w-full border-t border-white/5 bg-[#0a0a0c]/80 py-12 text-zinc-400 backdrop-blur-xl">
      <div className="container mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 md:flex-row">
        {/* Left Side: Branding */}
        <div className="flex flex-col items-center gap-1 md:items-start">
          <Link
            href="/"
            className="group flex items-center gap-1.5 font-sans text-xl font-bold tracking-tight transition-all hover:scale-[1.02]"
          >
            <span className="bg-gradient-to-r from-white via-zinc-400 to-white bg-[length:200%_auto] bg-clip-text text-transparent drop-shadow-md transition-all group-hover:animate-[shimmer_3s_infinite_linear]">
              DocScrive
            </span>
          </Link>
          <p className="text-xs font-medium tracking-wide text-zinc-500">
            GitHub Repository Technical Documentation
          </p>
        </div>

        {/* Center/Right Side: Links */}
        <div className="flex items-center gap-6">
          <Link
            href="/#workflow"
            className="text-sm font-medium transition-colors hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
          >
            Workflow
          </Link>
          <Link
            href="/contact"
            className="text-sm font-medium transition-colors hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
          >
            Contact
          </Link>
        </div>

        {/* Right Side: Made By Badge */}
        <div className="flex items-center">
          <p className="text-xs tracking-wider text-zinc-500">
            {new Date().getFullYear()} DocScrive
          </p>
        </div>
      </div>
    </footer>
  );
}
