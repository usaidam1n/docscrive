'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { logger } from '../../../lib/logger';
import { analytics } from '../../../lib/analytics';
import type { GitHubUser } from '../../../types/github';

interface GitHubAuthState {
  user: GitHubUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  scopes: string[];
}

interface GitHubAuthContextType extends GitHubAuthState {
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const GitHubAuthContext = createContext<GitHubAuthContextType | null>(null);

interface GitHubAuthProviderProps {
  children: React.ReactNode;
}

export function GitHubAuthProvider({ children }: GitHubAuthProviderProps) {
  const [authState, setAuthState] = useState<GitHubAuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
    scopes: [],
  });

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      const configResponse = await fetch('/api/auth/github/config', {
        method: 'GET',
        credentials: 'include',
      });

      if (!configResponse.ok) {
        throw new Error('Failed to check GitHub configuration');
      }

      const configData = await configResponse.json();

      if (!configData.isConfigured) {
        setAuthState({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error:
            'GitHub integration is not configured. Please set up your GitHub OAuth credentials.',
          scopes: [],
        });
        return;
      }

      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();

        setAuthState({
          user: data.user,
          token: null, // Don't expose token to client
          isAuthenticated: data.isAuthenticated,
          isLoading: false,
          error: null,
          scopes: data.scopes || [],
        });

        if (data.user) {
          logger.info('User authenticated', {
            userId: data.user.id,
            username: data.user.login,
          });

          analytics.trackUserAction('auth_check_success', {
            userId: data.user.id,
            username: data.user.login,
          });
        }
      } else if (response.status === 401) {
        setAuthState({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          scopes: [],
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        setAuthState({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: errorData.error || 'Failed to check authentication status',
          scopes: [],
        });
      }
    } catch (error) {
      logger.error('Auth status check failed', { error });

      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Failed to check authentication status',
        scopes: [],
      });
    }
  }, []);

  const login = useCallback(async () => {
    try {
      const configResponse = await fetch('/api/auth/github/config', {
        method: 'GET',
        credentials: 'include',
      });

      if (!configResponse.ok) {
        throw new Error('Failed to check GitHub configuration');
      }

      const configData = await configResponse.json();

      if (!configData.isConfigured) {
        setAuthState(prev => ({
          ...prev,
          error:
            'GitHub integration is not configured. Please contact your administrator.',
        }));
        return;
      }

      logger.info('Initiating GitHub login');
      analytics.trackUserAction('auth_login_initiated');
      window.location.href = '/api/auth/github';
    } catch (error) {
      logger.error('Login failed', { error });
      setAuthState(prev => ({
        ...prev,
        error: 'Failed to initiate GitHub login. Please try again.',
      }));
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        setAuthState({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          scopes: [],
        });

        logger.info('User logged out successfully');
        analytics.trackUserAction('auth_logout_success');
      } else {
        throw new Error('Logout request failed');
      }
    } catch (error) {
      logger.error('Logout failed', { error });
      analytics.trackError(error as Error, { action: 'logout' });

      setAuthState(prev => ({
        ...prev,
        error: 'Failed to log out. Please try again.',
        isLoading: false,
      }));
    }
  }, []);

  const refreshAuth = useCallback(async () => {
    await checkAuthStatus();
  }, [checkAuthStatus]);

  const contextValue: GitHubAuthContextType = {
    ...authState,
    login,
    logout,
    refreshAuth,
  };

  return (
    <GitHubAuthContext.Provider value={contextValue}>
      {children}
    </GitHubAuthContext.Provider>
  );
}

export function useGitHubAuth(): GitHubAuthContextType {
  const context = useContext(GitHubAuthContext);

  if (!context) {
    throw new Error('useGitHubAuth must be used within a GitHubAuthProvider');
  }

  return context;
}
