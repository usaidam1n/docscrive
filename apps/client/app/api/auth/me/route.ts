import { NextResponse } from 'next/server';
import { authManager } from '../../../../lib/auth';
import { githubClient } from '../../../../lib/github-client';
import { logger } from '../../../../lib/logger';
import { AuthenticationError } from '../../../../lib/errors';

export async function GET() {
  try {
    const payload = await authManager.verifySession();
    githubClient.setToken(payload.github_token);

    const authState = {
      user: payload.github_user,
      isAuthenticated: true,
      scopes: payload.scopes,
      expiresAt: new Date(payload.exp * 1000).toISOString(),
    };

    return NextResponse.json(authState);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        {
          user: null,
          isAuthenticated: false,
          error: error.message,
        },
        { status: 401 }
      );
    }

    logger.error('Failed to get current user', { error });

    return NextResponse.json(
      { error: 'Failed to get user information' },
      { status: 500 }
    );
  }
}
