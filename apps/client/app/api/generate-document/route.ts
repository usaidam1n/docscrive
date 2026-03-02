import { NextRequest, NextResponse } from 'next/server';
import { authManager } from '../../../lib/auth';
import { apiConfig } from '../../../lib/config';
import { logger } from '../../../lib/logger';
import { AuthenticationError } from '../../../lib/errors';
import crypto from 'crypto';

function generateNonce(length: number = 16): string {
  return crypto.randomBytes(length).toString('hex');
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

export async function POST(request: NextRequest) {
  try {
    // Get user's GitHub token from their session
    const userSession = await authManager.verifySession();

    if (!userSession || !userSession.github_token) {
      logger.warn('Authentication failed - no session or token');
      return NextResponse.json(
        { error: 'GitHub authentication required. Please log in with GitHub.' },
        { status: 401 }
      );
    }

    // Get the request body from frontend
    const requestBody = await request.json();

    logger.info('Proxying documentation generation request', {
      userId: userSession.sub,
      repository: requestBody.repository?.full_name,
    });

    // Prepare the payload for backend
    const backendPayload = {
      ...requestBody,
      // Add user's GitHub token
      githubToken: userSession.github_token,
      // Add user context
      userContext: {
        userId: userSession.sub,
        username: userSession.github_user.login,
        email: userSession.github_user.email,
      },
    };

    // Generate security headers for backend call
    const timestamp = Date.now().toString();
    const nonce = generateNonce();
    const signature = generateSignature(timestamp, nonce, backendPayload);

    // Forward request to backend with user's GitHub token
    const backendBase = apiConfig.baseUrl ?? 'http://localhost:3003/api';
    const backendResponse = await fetch(`${backendBase}/generate-document`, {
      method: 'POST',
      headers: {
        Accept: 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
        'User-Agent': 'DocScrive-NextJS/1.0',
        Origin: request.headers.get('origin') || 'http://localhost:3000',
        'x-timestamp': timestamp,
        'x-nonce': nonce,
        'x-signature': signature,
      },
      body: JSON.stringify(backendPayload),
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({}));
      logger.error('Backend documentation generation failed', {
        status: backendResponse.status,
        error: errorData,
        userId: userSession.sub,
      });

      return NextResponse.json(
        {
          error: errorData.error || 'Documentation generation failed',
          details: errorData.details,
        },
        { status: backendResponse.status }
      );
    }

    logger.info('Documentation generation started (streaming)', {
      userId: userSession.sub,
      repository: requestBody.repository?.full_name,
    });

    // Stream the response back to the client
    return new NextResponse(backendResponse.body, {
      status: backendResponse.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      logger.warn('Documentation generation auth failure', {
        message: error.message,
      });
      return NextResponse.json(
        {
          error: 'Authentication required. Please log in with GitHub again.',
        },
        { status: 401 }
      );
    }

    logger.error('Documentation generation proxy error', { error });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
