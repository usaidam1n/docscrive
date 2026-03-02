'use client';

import { cn } from '../../../lib/utils';
import { Card, CardContent, CardHeader } from './card';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn('bg-muted/60 animate-pulse rounded-md', className)}
      {...props}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="space-y-4 rounded-lg border p-6">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}

export function SkeletonButton() {
  return <Skeleton className="h-9 w-24 rounded-md" />;
}

export function SkeletonBadge() {
  return <Skeleton className="h-5 w-16 rounded-full" />;
}

export function GitHubDocsPageSkeleton() {
  return (
    <div className="bg-background animate-in fade-in-50 flex min-h-screen flex-col duration-300">
      {/* Navbar Skeleton */}
      <div className="border-b">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-32" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-8 w-20 rounded-md" />
            </div>
          </div>
        </div>
      </div>

      {/* Header Skeleton */}
      <div className="border-b">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-80" />
              <Skeleton className="h-4 w-96" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-8 w-20 rounded-md" />
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps Skeleton */}
      <div className="bg-muted/30 border-b">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex items-center">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="hidden space-y-1 sm:block">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
                {index < 2 && <Skeleton className="mx-4 h-4 w-4" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <main className="container flex-1 space-y-6 py-8">
        {/* Repository Selection Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>

        {/* Or Configuration Panel */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="space-y-4 rounded-lg border p-6">
              <Skeleton className="h-6 w-32" />
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <div className="grid grid-cols-2 gap-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            </div>

            <div className="space-y-4 rounded-lg border p-6">
              <Skeleton className="h-6 w-40" />
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-5 w-12 rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-4 rounded-lg border p-6">
              <Skeleton className="h-6 w-24" />
              <div className="space-y-2">
                <Skeleton className="h-20 w-full" />
                <div className="flex gap-2">
                  <SkeletonBadge />
                  <SkeletonBadge />
                  <SkeletonBadge />
                </div>
              </div>
            </div>

            <div className="space-y-4 rounded-lg border p-6">
              <Skeleton className="h-6 w-28" />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-8 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-full" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4">
          <SkeletonButton />
          <SkeletonButton />
        </div>
      </main>

      {/* Footer Skeleton */}
      <div className="bg-muted/30 border-t py-6">
        <div className="container">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-40" />
            <div className="flex gap-4">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="w-18 h-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Compact skeleton for smaller loading states
export function CompactGitHubSkeleton() {
  return (
    <div className="animate-in fade-in-50 space-y-6 duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <div className="flex gap-2">
          <SkeletonBadge />
          <SkeletonButton />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SkeletonCard />
        <SkeletonCard />
      </div>

      <div className="flex justify-center">
        <Skeleton className="h-8 w-8 animate-spin rounded-full" />
      </div>
    </div>
  );
}

// Step-specific skeletons
export function RepositorySelectionSkeleton() {
  return (
    <div className="animate-in fade-in-50 space-y-6 duration-300">
      {/* Search and filters */}
      <Card>
        <CardHeader>
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-24" />
          </div>
        </CardContent>
      </Card>

      {/* Repository grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>

      {/* Load more */}
      <div className="flex justify-center">
        <SkeletonButton />
      </div>
    </div>
  );
}

export function ConfigurationSkeleton() {
  return (
    <div className="animate-in fade-in-50 space-y-6 duration-300">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left column */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-32 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-32 w-full" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-5 w-12 rounded-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <SkeletonBadge />
                <SkeletonBadge />
                <SkeletonBadge />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-36" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-24 w-full" />
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-between pt-4">
        <SkeletonButton />
        <SkeletonButton />
      </div>
    </div>
  );
}

export function GenerationSkeleton() {
  return (
    <div className="animate-in fade-in-50 space-y-6 duration-300">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <SkeletonButton />
          </div>
        </CardHeader>
      </Card>

      {/* Progress */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-36" />
            <SkeletonBadge />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-8" />
            </div>
            <Skeleton className="h-2 w-full" />
          </div>

          <div className="flex items-center justify-between">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex flex-col items-center space-y-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-1 text-center">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-20" />
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <SkeletonButton />
            <SkeletonButton />
          </div>
        </CardContent>
      </Card>

      {/* Log */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
