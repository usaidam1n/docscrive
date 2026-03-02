import { NextResponse } from 'next/server';
import { authManager } from '../../../../lib/auth';
import { githubClient } from '../../../../lib/github-client';
import { logger } from '../../../../lib/logger';

export async function POST() {
  try {
    let userId: string | undefined;
    try {
      const payload = await authManager.verifySession();
      userId = payload.sub;
    } catch {
      // Session invalid or missing — continue with logout
    }

    authManager.destroySession();
    githubClient.clearToken();

    logger.info('User logged out', {
      userId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Logout failed', { error });

    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
}
