'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, FileText, Home, Settings } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './ui/sheet';
import { Button } from './ui/button';
import { cn } from '../theme-config';
import { useSettingsModal } from './providers/SettingsProvider';

export default function Navbar() {
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  const { openModal } = useSettingsModal();

  const isActive = (path: string) => pathname === path;

  // Navigation items for mobile drawer
  const navItems = [
    { href: '/', label: 'Home', icon: <Home className="mr-2 h-4 w-4" /> },
    {
      href: '/document-your-code',
      label: 'Document Your Code',
      icon: <FileText className="mr-2 h-4 w-4" />,
    },
    // {
    //   href: '/faq',
    //   label: 'FAQ',
    //   icon: <HelpCircle className="mr-2 h-4 w-4" />,
    // },
  ];

  return (
    <>
      {/* Floating Pill Header Wrapper */}
      <div className="pointer-events-none fixed left-0 right-0 top-4 z-50 flex w-full justify-center px-4">
        <header className="pointer-events-auto flex w-full max-w-4xl items-center justify-between rounded-full border border-white/10 bg-[#0a0a0c]/60 px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-2xl transition-all duration-300">
          {/* Logo / Branding */}
          <div className="flex flex-shrink-0 items-center">
            <Link
              href="/"
              className="group flex items-center gap-1.5 font-sans text-xl font-bold tracking-tight transition-all hover:scale-[1.02]"
            >
              <span
                className={cn(
                  'bg-clip-text text-transparent transition-all group-hover:animate-[shimmer_3s_infinite_linear]',
                  'bg-gradient-to-r from-white via-zinc-400 to-white bg-[length:200%_auto] drop-shadow-md'
                )}
              >
                DocScrive
              </span>
            </Link>
          </div>

          {/* Center Navigation Links - Desktop only */}
          <div className="absolute left-1/2 hidden -translate-x-1/2 items-center justify-center space-x-8 md:flex">
            {[
              { label: 'Product', href: '/#product' },
              { label: 'Workflow', href: '/#workflow' },
              { label: 'Security', href: '/#security' },
            ].map(item => (
              <Link
                key={item.label}
                href={item.href}
                className="border-b-2 border-transparent pb-0.5 text-sm font-medium text-zinc-300 transition-colors hover:border-[#2ecc71]/50 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Right side Actions */}
          <div className="flex items-center gap-3">
            {/* Mobile menu trigger */}
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-white hover:bg-white/10 md:hidden"
                >
                  <Menu className="h-4 w-4" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[250px] sm:w-[300px]">
                <SheetHeader>
                  <SheetTitle className="text-white">Menu</SheetTitle>
                </SheetHeader>
                <nav className="mt-8 flex flex-col gap-4">
                  {navItems.map(item => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center rounded-lg px-3 py-2 text-sm transition-all hover:bg-white/10 hover:text-white',
                        isActive(item.href)
                          ? 'border-l-2 border-emerald-500 bg-gradient-to-r from-emerald-500/20 to-transparent font-medium text-emerald-400'
                          : 'text-zinc-400'
                      )}
                    >
                      {item.icon}
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>

            {/* <Link
              href="/login"
              className="hidden text-sm font-medium text-zinc-300 transition-colors hover:text-white sm:block"
            >
              Log In
            </Link> */}

            {isHomePage ? (
              <Link href="/document-your-code">
                <Button className="flex h-8 items-center justify-center rounded-full bg-[#2ecc71] px-4 text-sm font-semibold text-black shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 hover:bg-[#27ae60]">
                  Start Free
                </Button>
              </Link>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => openModal()}
                className="relative h-8 w-8 rounded-full text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
                title="Settings"
              >
                <Settings className="h-4 w-4" />
                <span className="sr-only">Settings</span>
              </Button>
            )}
          </div>
        </header>
      </div>
    </>
  );
}
