import { NextResponse } from 'next/server';
import { authManager } from '../../../../lib/auth';
import { githubClient } from '../../../../lib/github-client';
import { logger } from '../../../../lib/logger';

export async function GET() {
  try {
    // Verify user session
    const session = await authManager.verifySession();

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Set GitHub token and fetch current user
    githubClient.setToken(session.github_token);
    const githubUser = await githubClient.getCurrentUser();

    logger.info('Full GitHub user data fetched', {
      userId: githubUser.id,
      username: githubUser.login,
      publicRepos: githubUser.public_repos,
      followers: githubUser.followers,
    });

    return NextResponse.json(githubUser);
  } catch (error) {
    logger.error('Failed to fetch GitHub user data', { error });

    return NextResponse.json(
      { error: 'Failed to fetch user data' },
      { status: 500 }
    );
  }
}
