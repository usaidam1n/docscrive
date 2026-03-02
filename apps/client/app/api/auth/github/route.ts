import { NextRequest, NextResponse } from 'next/server';
import { authManager } from '../../../../lib/auth';
import { github as githubConfig } from '../../../../lib/config';
import { logger } from '../../../../lib/logger';

// GET /api/auth/github - Redirect to GitHub OAuth
export async function GET(request: NextRequest) {
  try {
    // Check if GitHub is configured
    if (!githubConfig.isConfigured) {
      logger.warn('GitHub OAuth attempted but not configured');
      return NextResponse.json(
        { error: 'GitHub integration is not configured' },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const redirectUri = searchParams.get('redirect_uri');

    const oauthUrl = authManager.generateOAuthURL(redirectUri || undefined);

    logger.info('Redirecting to GitHub OAuth', {
      hasRedirectUri: !!redirectUri,
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.redirect(oauthUrl);
  } catch (error) {
    logger.error('Failed to initiate GitHub OAuth', { error });

    return NextResponse.json(
      { error: 'Failed to initiate GitHub authentication' },
      { status: 500 }
    );
  }
}
