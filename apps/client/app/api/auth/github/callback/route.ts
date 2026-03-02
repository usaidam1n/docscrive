import { NextRequest, NextResponse } from 'next/server';
import { authManager } from '../../../../../lib/auth';
import { githubClient } from '../../../../../lib/github-client';
import { logger } from '../../../../../lib/logger';
import {
  AuthenticationError,
  ValidationError,
} from '../../../../../lib/errors';
import { apiConfig } from '../../../../../lib/config';
import crypto from 'crypto';

function generateNonce(): string {
  return crypto.randomUUID();
}

function generateSignature(
  timestamp: string,
  nonce: string,
  body: any
): string {
  const payload = JSON.stringify({
    timestamp,
    nonce,
    body,
  });

  return crypto
    .createHmac('sha256', apiConfig.secret)
    .update(payload)
    .digest('hex');
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (error) {
      logger.warn('GitHub OAuth error', { error, errorDescription });

      const errorUrl = new URL('/auth/error', request.url);
      errorUrl.searchParams.append('error', error);
      if (errorDescription) {
        errorUrl.searchParams.append('description', errorDescription);
      }

      return NextResponse.redirect(errorUrl);
    }

    if (!code || !state) {
      throw new ValidationError('Missing code or state parameter');
    }

    const githubToken = await authManager.exchangeCodeForToken(code, state);
    githubClient.setToken(githubToken.access_token);
    const githubUser = await githubClient.getCurrentUser();
    const backendUrl = apiConfig.baseUrl || 'http://localhost:3003/api';
    try {
      const syncPayload = {
        githubId: githubUser.id.toString(),
        githubToken: githubToken.access_token,
        email: githubUser.email || null,
        name: githubUser.name || githubUser.login || null,
        avatarUrl: githubUser.avatar_url || null,
      };

      const timestamp = Date.now().toString();
      const nonce = generateNonce();
      const signature = generateSignature(timestamp, nonce, syncPayload);

      await fetch(`${backendUrl}/auth/sync-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-timestamp': timestamp,
          'x-nonce': nonce,
          'x-signature': signature,
        },
        body: JSON.stringify(syncPayload),
      });
    } catch (syncError) {
      // Non-fatal: session still works; backend sync will retry on next login
      logger.warn('Backend user sync failed during OAuth callback', {
        syncError,
      });
    }

    await authManager.createSession(githubToken, githubUser);

    logger.info('GitHub authentication successful', {
      userId: githubUser.id,
      username: githubUser.login,
      userAgent: request.headers.get('user-agent'),
    });

    const successUrl = new URL('/document-your-code', request.url);
    successUrl.searchParams.append('flow', 'github');

    return NextResponse.redirect(successUrl);
  } catch (error) {
    logger.error('GitHub OAuth callback failed', { error });

    let errorMessage = 'Authentication failed';

    if (
      error instanceof AuthenticationError ||
      error instanceof ValidationError
    ) {
      errorMessage = error.message;
    }

    const errorUrl = new URL('/auth/error', request.url);
    errorUrl.searchParams.append('error', 'callback_failed');
    errorUrl.searchParams.append('description', errorMessage);

    return NextResponse.redirect(errorUrl);
  }
}
