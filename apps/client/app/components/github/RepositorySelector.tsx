'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  Search,
  GitBranch,
  Star,
  GitFork,
  Calendar,
  Lock,
  Globe,
  AlertCircle,
} from 'lucide-react';
import { useGitHubAuth } from '../providers/GitHubAuthProvider';
import { logger } from '../../../lib/logger';
import type { GitHubRepository } from '../../../types/github';

interface RepositorySelectorProps {
  onRepositorySelect: (repository: GitHubRepository) => void;
  selectedRepository: GitHubRepository | null;
}

export function RepositorySelector({
  onRepositorySelect,
  selectedRepository,
}: RepositorySelectorProps) {
  const { user, isAuthenticated } = useGitHubAuth();
  const [repositories, setRepositories] = useState<GitHubRepository[]>([]);
  const [filteredRepositories, setFilteredRepositories] = useState<
    GitHubRepository[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'public' | 'private'>('all');
  const [sortBy, setSortBy] = useState<
    'updated' | 'created' | 'pushed' | 'name' | 'stars'
  >('pushed');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchRepositories();
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    filterRepositories();
  }, [repositories, searchQuery, filter, sortBy, sortDirection]);

  const fetchRepositories = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/github/repositories', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401)
          throw new Error('Authentication required. Please log in again.');
        else if (response.status === 403)
          throw new Error(
            'Access denied. Please check your GitHub permissions.'
          );
        else if (response.status === 429)
          throw new Error('Rate limit exceeded. Please try again later.');
        else if (response.status === 502)
          throw new Error(
            'GitHub service temporarily unavailable. Please try again later.'
          );
        else
          throw new Error(`Failed to fetch repositories: ${response.status}`);
      }

      const data = await response.json();
      if (!data.success)
        throw new Error(data.error || 'Failed to fetch repositories');

      setRepositories(data.repositories);
      logger.info('Successfully fetched repositories', {
        count: data.repositories.length,
        privateCount: data.repositories.filter((r: any) => r.private).length,
        publicCount: data.repositories.filter((r: any) => !r.private).length,
        user: data.user?.login,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to fetch repositories. Please try again.';
      setError(errorMessage);
      console.error('Error fetching repositories:', err);
      setRepositories([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterRepositories = () => {
    let filtered = repositories;

    if (searchQuery) {
      filtered = filtered.filter(
        repo =>
          repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          repo.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          repo.topics.some(topic =>
            topic.toLowerCase().includes(searchQuery.toLowerCase())
          )
      );
    }

    if (filter !== 'all') {
      filtered = filtered.filter(repo => {
        const isPrivate = Boolean(repo.private);
        return filter === 'private' ? isPrivate : !isPrivate;
      });
    }

    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'stars':
          aValue = a.stargazers_count;
          bValue = b.stargazers_count;
          break;
        case 'created':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case 'pushed':
          aValue = new Date(a.pushed_at).getTime();
          bValue = new Date(b.pushed_at).getTime();
          break;
        case 'updated':
        default:
          aValue = new Date(a.updated_at).getTime();
          bValue = new Date(b.updated_at).getTime();
          break;
      }
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });

    setFilteredRepositories(filtered);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center gap-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
        <AlertCircle className="h-5 w-5 shrink-0 text-amber-400" />
        <p className="text-sm font-medium text-amber-200/90">
          Please authenticate with GitHub to access your repositories.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-5">
      {/* Search + filters — modern command-palette style */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-4">
        <div className="group relative flex flex-1">
          <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/5 opacity-0 transition-opacity group-focus-within:opacity-100" />
          <div className="relative flex w-full items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3.5 shadow-sm transition-all duration-200 focus-within:border-emerald-500/30 focus-within:bg-white/[0.06] focus-within:shadow-[0_0_0_1px_rgba(16,185,129,0.2)]">
            <Search className="h-4 w-4 shrink-0 text-zinc-500 transition-colors group-focus-within:text-emerald-400" />
            <input
              type="text"
              placeholder="Search repositories..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full flex-1 border-none bg-transparent text-sm font-medium text-white outline-none placeholder:text-zinc-500"
            />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 rounded-xl border border-white/[0.06] bg-white/[0.03] p-1">
          {(['all', 'public', 'private'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition-all ${
                filter === f
                  ? 'bg-white/[0.12] text-white shadow-sm'
                  : 'text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-300'
              }`}
            >
              {f === 'public' && <Globe className="h-3.5 w-3.5" />}
              {f === 'private' && <Lock className="h-3.5 w-3.5" />}
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Count + sort row */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-500">
          {filteredRepositories.length}{' '}
          {filteredRepositories.length === 1 ? 'repository' : 'repositories'}
        </span>
        <div className="flex items-center gap-2 rounded-lg bg-white/[0.03] px-2 py-1">
          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="cursor-pointer border-none bg-transparent text-xs font-medium text-zinc-400 outline-none transition-colors hover:text-zinc-300"
          >
            <option value="updated">Recently updated</option>
            <option value="created">Recently created</option>
            <option value="name">Alphabetical</option>
            <option value="stars">Most stars</option>
          </select>
          <button
            className="flex h-6 w-6 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-zinc-300"
            onClick={() =>
              setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
            }
            aria-label="Toggle sort direction"
          >
            {sortDirection === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {/* Repository list — cards with hover lift and clear hierarchy */}
      <div className="workspace-scrollbar max-h-[calc(100vh-320px)] space-y-3 overflow-y-auto pr-1">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="flex animate-pulse items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4"
              >
                <div className="h-11 w-11 rounded-xl bg-white/[0.06]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 rounded-lg bg-white/[0.06]" />
                  <div className="h-3 w-1/4 rounded-lg bg-white/[0.04]" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-10 text-center">
            <AlertCircle className="mx-auto mb-4 h-8 w-8 text-red-400/80" />
            <p className="text-sm font-medium text-red-400">{error}</p>
          </div>
        ) : filteredRepositories.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.02] p-14 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.06]">
              <GitBranch className="h-7 w-7 text-zinc-600" />
            </div>
            <h3 className="mb-2 text-sm font-semibold text-zinc-400">
              No repositories found
            </h3>
            <p className="mx-auto max-w-sm text-xs text-zinc-500">
              {searchQuery
                ? 'Try adjusting your search or filters.'
                : 'No repositories in this account.'}
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {filteredRepositories.map((repository, i) => {
              const isSelected = selectedRepository?.id === repository.id;

              return (
                <motion.div
                  key={repository.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{
                    duration: 0.25,
                    delay: Math.min(i * 0.02, 0.2),
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className={`group/repo relative cursor-pointer overflow-hidden rounded-2xl transition-all duration-200 ${
                    isSelected
                      ? 'border border-emerald-500/30 bg-emerald-500/[0.08] shadow-[0_0_24px_rgba(16,185,129,0.12)] ring-1 ring-emerald-500/20'
                      : 'border border-white/[0.06] bg-white/[0.03] hover:-translate-y-0.5 hover:border-white/[0.12] hover:bg-white/[0.06] hover:shadow-lg'
                  }`}
                  onClick={() => onRepositorySelect(repository)}
                >
                  {/* Selected accent bar */}
                  {isSelected && (
                    <div className="absolute bottom-0 left-0 top-0 w-1 bg-gradient-to-b from-emerald-400 to-teal-400" />
                  )}

                  <div className="flex flex-col gap-3 p-4 pl-5 sm:flex-row sm:items-center sm:gap-4">
                    <div className="flex min-w-0 flex-1 items-center gap-4">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors ${
                          isSelected
                            ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30'
                            : 'bg-white/[0.06] text-zinc-400 group-hover/repo:bg-white/[0.1] group-hover/repo:text-white'
                        }`}
                      >
                        <GitBranch className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3
                          className={`truncate text-sm font-semibold tracking-tight ${isSelected ? 'text-emerald-400' : 'text-white'}`}
                        >
                          {repository.name}
                        </h3>
                        <p className="truncate text-xs text-zinc-500">
                          {repository.full_name}
                        </p>
                        {repository.description && (
                          <p className="mt-1 line-clamp-1 text-xs text-zinc-600">
                            {repository.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                      {repository.language && (
                        <span
                          className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[11px] font-medium ${
                            isSelected
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : 'bg-white/[0.06] text-zinc-500'
                          }`}
                        >
                          {repository.language}
                        </span>
                      )}
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium ${
                          repository.private
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-white/[0.06] text-zinc-500'
                        }`}
                      >
                        {repository.private ? (
                          <>
                            <Lock className="h-3 w-3" /> Private
                          </>
                        ) : (
                          <>
                            <Globe className="h-3 w-3" /> Public
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-5 border-t border-white/[0.04] px-4 py-2.5 pl-5 text-[11px]">
                    <span className="flex items-center gap-1.5 text-zinc-500">
                      <Star className="h-3.5 w-3.5 fill-zinc-600 text-zinc-600" />
                      {repository.stargazers_count}
                    </span>
                    <span className="flex items-center gap-1.5 text-zinc-500">
                      <GitFork className="h-3.5 w-3.5 text-zinc-600" />
                      {repository.forks_count}
                    </span>
                    <span className="flex items-center gap-1.5 text-zinc-500">
                      <Calendar className="h-3.5 w-3.5 text-zinc-600" />
                      {formatDate(repository.updated_at)}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
