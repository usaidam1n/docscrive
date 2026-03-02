import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { logger } from './logger';
import { jwt as jwtConfig, github as githubConfig } from './config';
import { AuthenticationError, ValidationError } from './errors';
import type {
  GitHubUser,
  GitHubAuthToken,
  GitHubAuthState,
} from '../types/github';

// Token schemas
const GitHubTokenSchema = z.object({
  access_token: z.string(),
  token_type: z.literal('bearer'),
  scope: z.string().optional().default(''),
  expires_at: z.string().optional(),
  refresh_token: z.string().optional(),
  refresh_token_expires_at: z.string().optional(),
});

const JWTPayloadSchema = z.object({
  sub: z.string(), // GitHub user ID
  github_token: z.string(),
  github_user: z.object({
    id: z.number(),
    login: z.string(),
    name: z.string().nullable(),
    email: z.string().nullable(),
    avatar_url: z.string(),
    html_url: z.string().optional(),
    type: z.enum(['User', 'Organization']).optional(),
    public_repos: z.number().optional(),
    private_repos: z.number().optional(),
    followers: z.number().optional(),
    following: z.number().optional(),
  }),
  scopes: z.array(z.string()),
  iat: z.number(),
  exp: z.number(),
  iss: z.string(),
});

type JWTPayload = z.infer<typeof JWTPayloadSchema>;

export class AuthManager {
  private static readonly JWT_COOKIE_NAME = 'docscrive-auth';
  private static readonly JWT_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds
  private static readonly OAUTH_STATE_COOKIE = 'github-oauth-state';
  private static readonly OAUTH_STATE_MAX_AGE = 10 * 60; // 10 minutes in seconds

  constructor() {}

  // OAuth flow methods
  generateOAuthURL(
    redirectUri: string = githubConfig.redirectUri ?? ''
  ): string {
    if (!githubConfig.isConfigured) {
      throw new AuthenticationError('GitHub integration is not configured');
    }

    const state = this.generateSecureState();
    const params = new URLSearchParams({
      client_id: githubConfig.clientId,
      redirect_uri: redirectUri,
      scope: githubConfig.scopes.join(' '),
      state,
      response_type: 'code',
    });

    // Store state in cookie for validation
    this.setOAuthStateCookie(state);

    const oauthUrl = `${githubConfig.authUrl}/authorize?${params.toString()}&prompt=consent`;

    logger.info('OAuth URL generated', {
      redirectUri,
      scopes: githubConfig.scopes,
      hasState: !!state,
    });

    return oauthUrl;
  }

  async exchangeCodeForToken(
    code: string,
    state: string
  ): Promise<GitHubAuthToken> {
    if (!githubConfig.isConfigured) {
      throw new AuthenticationError('GitHub integration is not configured');
    }

    // Validate state
    const storedState = this.getOAuthStateCookie();
    logger.info('OAuth state validation', {
      receivedStatePrefix: state.substring(0, 8) + '...',
      storedStatePrefix: storedState
        ? storedState.substring(0, 8) + '...'
        : null,
      match: storedState === state,
    });

    if (!storedState || storedState !== state) {
      logger.error('OAuth state mismatch', {
        receivedLength: state.length,
        storedLength: storedState?.length || 0,
      });
      throw new AuthenticationError('Invalid OAuth state parameter');
    }

    try {
      const response = await fetch(`${githubConfig.authUrl}/access_token`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: githubConfig.clientId,
          client_secret: githubConfig.clientSecret,
          code,
          redirect_uri: githubConfig.redirectUri,
        }),
      });

      if (!response.ok) {
        throw new Error(`GitHub OAuth error: ${response.status}`);
      }

      const data = await response.json();

      logger.info('Raw GitHub token response', {
        hasAccessToken: !!data.access_token,
        tokenType: data.token_type,
        scope: data.scope,
        scopeType: typeof data.scope,
        allFields: Object.keys(data),
      });

      if (data.error) {
        throw new Error(
          `GitHub OAuth error: ${data.error_description || data.error}`
        );
      }

      // Validate token response
      const token = GitHubTokenSchema.parse(data);

      // Clear OAuth state cookie
      this.clearOAuthStateCookie();

      logger.info('GitHub token exchanged successfully', {
        hasToken: !!token.access_token,
        scopes: token.scope,
        tokenType: token.token_type,
      });

      return token;
    } catch (error) {
      logger.error('Failed to exchange OAuth code for token', { error });
      throw new AuthenticationError('Failed to authenticate with GitHub');
    }
  }

  // JWT methods
  async createSession(
    githubToken: GitHubAuthToken,
    githubUser: GitHubUser
  ): Promise<string> {
    try {
      const processedScopes = githubToken.scope
        ? githubToken.scope.split(' ').filter(scope => scope.trim() !== '')
        : [];

      logger.info('Processing GitHub token scopes', {
        rawScope: githubToken.scope,
        processedScopes,
        scopeCount: processedScopes.length,
      });

      const payload: Omit<JWTPayload, 'iat' | 'exp' | 'iss'> = {
        sub: githubUser.id.toString(),
        github_token: githubToken.access_token,
        github_user: {
          id: githubUser.id,
          login: githubUser.login,
          name: githubUser.name,
          email: githubUser.email,
          avatar_url: githubUser.avatar_url,
          html_url: githubUser.html_url,
          type: githubUser.type,
          public_repos: githubUser.public_repos,
          private_repos: githubUser.private_repos,
          followers: githubUser.followers,
          following: githubUser.following,
        },
        scopes: processedScopes,
      };

      const jwt = await new SignJWT(payload)
        .setProtectedHeader({ alg: jwtConfig.algorithm })
        .setIssuedAt()
        .setExpirationTime(jwtConfig.expiresIn)
        .setIssuer(jwtConfig.issuer)
        .sign(new TextEncoder().encode(jwtConfig.secret));

      // Set secure HTTP-only cookie
      this.setJWTCookie(jwt);

      logger.info('User session created', {
        userId: githubUser.id,
        username: githubUser.login,
        scopes: payload.scopes,
      });

      return jwt;
    } catch (error) {
      logger.error('Failed to create session', { error });
      throw new AuthenticationError('Failed to create user session');
    }
  }

  async verifySession(token?: string): Promise<JWTPayload> {
    try {
      const jwt = token || this.getJWTCookie();
      if (!jwt) {
        throw new AuthenticationError('No authentication token found');
      }

      const { payload } = await jwtVerify(
        jwt,
        new TextEncoder().encode(jwtConfig.secret),
        {
          issuer: jwtConfig.issuer,
        }
      );

      // Validate payload structure
      const validatedPayload = JWTPayloadSchema.parse(payload);

      logger.debug('Session verified', {
        userId: validatedPayload.sub,
        username: validatedPayload.github_user.login,
        expiresAt: new Date(validatedPayload.exp * 1000).toISOString(),
      });

      return validatedPayload;
    } catch (error) {
      logger.warn('Session verification failed', { error });
      throw new AuthenticationError('Invalid or expired session');
    }
  }

  async refreshSession(currentToken: string): Promise<string> {
    try {
      const payload = await this.verifySession(currentToken);

      // Create new JWT with updated expiration
      const newJWT = await new SignJWT({
        sub: payload.sub,
        github_token: payload.github_token,
        github_user: payload.github_user,
        scopes: payload.scopes,
      })
        .setProtectedHeader({ alg: jwtConfig.algorithm })
        .setIssuedAt()
        .setExpirationTime(jwtConfig.expiresIn)
        .setIssuer(jwtConfig.issuer)
        .sign(new TextEncoder().encode(jwtConfig.secret));

      this.setJWTCookie(newJWT);

      logger.info('Session refreshed', {
        userId: payload.sub,
        username: payload.github_user.login,
      });

      return newJWT;
    } catch (error) {
      logger.error('Failed to refresh session', { error });
      throw new AuthenticationError('Failed to refresh session');
    }
  }

  destroySession(): void {
    this.clearJWTCookie();
    logger.info('User session destroyed');
  }

  // Cookie management
  private setJWTCookie(jwt: string): void {
    if (typeof window !== 'undefined') {
      // Client-side: JWT cookie must be HttpOnly and set by the server only
      logger.warn(
        'Attempted to set JWT cookie on the client; this is ignored for security reasons.'
      );
      return;
    }

    // Server-side: use Next.js cookies
    try {
      const cookieStore = cookies();
      cookieStore.set(AuthManager.JWT_COOKIE_NAME, jwt, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: AuthManager.JWT_MAX_AGE,
        path: '/',
      });
    } catch (error) {
      logger.warn('Could not set JWT cookie on server side', { error });
    }
  }

  private getJWTCookie(): string | null {
    if (typeof window !== 'undefined') {
      // Client-side: parse document.cookie
      const cookies = document.cookie.split(';').map(c => c.trim());
      const jwtCookie = cookies.find(c =>
        c.startsWith(`${AuthManager.JWT_COOKIE_NAME}=`)
      );
      return jwtCookie ? jwtCookie.split('=')[1] : null;
    } else {
      // Server-side: use Next.js cookies
      try {
        const cookieStore = cookies();
        return cookieStore.get(AuthManager.JWT_COOKIE_NAME)?.value || null;
      } catch (error) {
        logger.warn('Could not get JWT cookie on server side', { error });
        return null;
      }
    }
  }

  private clearJWTCookie(): void {
    if (typeof window !== 'undefined') {
      logger.warn(
        'Attempted to clear JWT cookie on the client; this is ignored for security reasons.'
      );
      return;
    }

    // Server-side
    try {
      const cookieStore = cookies();
      cookieStore.delete(AuthManager.JWT_COOKIE_NAME);
    } catch (error) {
      logger.warn('Could not clear JWT cookie on server side', { error });
    }
  }

  private setOAuthStateCookie(state: string): void {
    if (typeof window !== 'undefined') {
      // Client-side: Don't use Secure flag in development
      const secureFlag =
        process.env.NODE_ENV === 'production' ? '; Secure' : '';
      document.cookie = `${AuthManager.OAUTH_STATE_COOKIE}=${state}; Path=/; SameSite=Lax; Max-Age=${AuthManager.OAUTH_STATE_MAX_AGE}${secureFlag}`;
    } else {
      try {
        const cookieStore = cookies();
        cookieStore.set(AuthManager.OAUTH_STATE_COOKIE, state, {
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax', // Changed from 'strict' to 'lax' for OAuth
          maxAge: AuthManager.OAUTH_STATE_MAX_AGE,
          path: '/',
        });
        logger.info('OAuth state cookie set', {
          state: state.substring(0, 8) + '...',
          cookieName: AuthManager.OAUTH_STATE_COOKIE,
        });
      } catch (error) {
        logger.warn('Could not set OAuth state cookie', { error });
      }
    }
  }

  private getOAuthStateCookie(): string | null {
    if (typeof window !== 'undefined') {
      const cookies = document.cookie.split(';').map(c => c.trim());
      const stateCookie = cookies.find(c =>
        c.startsWith(`${AuthManager.OAUTH_STATE_COOKIE}=`)
      );
      return stateCookie ? stateCookie.split('=')[1] : null;
    } else {
      try {
        const cookieStore = cookies();
        const cookieValue =
          cookieStore.get(AuthManager.OAUTH_STATE_COOKIE)?.value || null;
        logger.info('OAuth state cookie retrieved', {
          found: !!cookieValue,
          value: cookieValue ? cookieValue.substring(0, 8) + '...' : null,
          cookieName: AuthManager.OAUTH_STATE_COOKIE,
        });
        return cookieValue;
      } catch (error) {
        logger.warn('Could not get OAuth state cookie', { error });
        return null;
      }
    }
  }

  private clearOAuthStateCookie(): void {
    if (typeof window !== 'undefined') {
      document.cookie = `${AuthManager.OAUTH_STATE_COOKIE}=; Path=/; Secure; SameSite=Strict; Max-Age=0`;
    } else {
      try {
        const cookieStore = cookies();
        cookieStore.delete(AuthManager.OAUTH_STATE_COOKIE);
      } catch (error) {
        logger.warn('Could not clear OAuth state cookie', { error });
      }
    }
  }

  // Utility methods
  private generateSecureState(): string {
    // Generate cryptographically secure random state
    const array = new Uint8Array(32);
    if (typeof window !== 'undefined' && window.crypto) {
      window.crypto.getRandomValues(array);
    } else {
      // Node.js environment
      require('crypto').randomFillSync(array);
    }
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join(
      ''
    );
  }

  // Middleware helper
  static async extractAuthFromRequest(
    request: NextRequest
  ): Promise<JWTPayload | null> {
    try {
      const authManager = new AuthManager();
      const token = request.cookies.get(AuthManager.JWT_COOKIE_NAME)?.value;

      if (!token) {
        return null;
      }

      return await authManager.verifySession(token);
    } catch (error) {
      logger.warn('Failed to extract auth from request', { error });
      return null;
    }
  }

  // Client-side auth state management
  getCurrentAuthState(): GitHubAuthState {
    try {
      const token = this.getJWTCookie();
      if (!token) {
        return {
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          scopes: [],
        };
      }

      // In a real implementation, you'd decode the JWT to get user info
      // For now, we'll assume it's valid if it exists
      return {
        user: null, // Would be populated from JWT payload
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        scopes: [], // Would be populated from JWT payload
      };
    } catch (error) {
      return {
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Failed to validate authentication',
        scopes: [],
      };
    }
  }
}

export const authManager = new AuthManager();
