import { NextRequest, NextResponse } from 'next/server';
import { authManager } from '../../../../lib/auth';
import { githubClient } from '../../../../lib/github-client';
import { logger } from '../../../../lib/logger';
import { AuthenticationError, RateLimitError } from '../../../../lib/errors';

export async function GET(request: NextRequest) {
  try {
    logger.info('Starting repository fetch request');
    const payload = await authManager.verifySession();

    logger.info('Session verified', {
      userId: payload.sub,
      username: payload.github_user.login,
      hasToken: !!payload.github_token,
      tokenLength: payload.github_token?.length || 0,
      scopes: payload.scopes,
    });

    githubClient.setToken(payload.github_token);

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    const sort = searchParams.get('sort') || 'updated';
    const direction = searchParams.get('direction') || 'desc';
    const per_page = Math.min(
      parseInt(searchParams.get('per_page') || '100'),
      100
    );
    const page = parseInt(searchParams.get('page') || '1');

    logger.info('Fetching user repositories', {
      userId: payload.sub,
      username: payload.github_user.login,
      type,
      sort,
      direction,
      per_page,
      page,
    });

    logger.info('Calling GitHub API for repositories');
    const repositories = await githubClient.getRepositories({
      type: type as any,
      sort: sort as any,
      direction: direction as any,
      per_page,
      page,
    });

    logger.info('GitHub API call successful', {
      repositoryCount: repositories.length,
      privateCount: repositories.filter(r => r.private).length,
      publicCount: repositories.filter(r => !r.private).length,
    });

    const shouldIncludeArchived =
      searchParams.get('include_archived') === 'true';
    const filteredRepositories = shouldIncludeArchived
      ? repositories
      : repositories.filter(repo => !repo.archived && !repo.disabled);

    logger.info('Successfully fetched repositories', {
      userId: payload.sub,
      totalCount: repositories.length,
      filteredCount: filteredRepositories.length,
      includeArchived: shouldIncludeArchived,
    });

    return NextResponse.json({
      success: true,
      repositories: filteredRepositories,
      pagination: {
        page,
        per_page,
        total: filteredRepositories.length,
        has_more: repositories.length === per_page,
      },
      user: {
        login: payload.github_user.login,
        id: payload.github_user.id,
        avatar_url: payload.github_user.avatar_url,
      },
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      logger.warn('Unauthenticated repository access attempt');
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (error instanceof RateLimitError) {
      logger.warn('GitHub rate limit exceeded', { error: error.message });
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded. Please try again later.',
        },
        { status: 429 }
      );
    }

    logger.error('Failed to fetch repositories', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      errorType: error?.constructor?.name,
      errorDetails: error,
    });

    return NextResponse.json(
      { success: false, error: 'Failed to fetch repositories' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
