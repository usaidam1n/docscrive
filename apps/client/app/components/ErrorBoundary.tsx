'use client';

import React from 'react';
import { Button } from './ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import Link from 'next/link';
import { isDevelopment } from '../../lib/config';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  errorId?: string;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const errorId = Math.random().toString(36).substring(7);
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  resetError = () => {
    this.setState({ hasError: false });
  };

  override render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error}
            resetError={this.resetError}
          />
        );
      }

      return (
        <div className="flex min-h-screen items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="bg-destructive/10 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
                <AlertTriangle className="text-destructive h-6 w-6" />
              </div>
              <CardTitle className="text-xl">Something went wrong</CardTitle>
              <CardDescription>
                We encountered an unexpected error. Please try again or contact
                support if the problem persists.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isDevelopment && (
                <div className="bg-muted rounded-md p-3">
                  <p className="text-muted-foreground mb-2 text-sm font-medium">
                    Error Details (Development):
                  </p>
                  <p className="text-destructive font-mono text-xs">
                    {this.state.error.message}
                  </p>
                  {this.state.errorId && (
                    <p className="text-muted-foreground mt-1 text-xs">
                      Error ID: {this.state.errorId}
                    </p>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  onClick={this.resetError}
                  variant="outline"
                  className="flex-1"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                <Button asChild className="flex-1">
                  <Link href="/">
                    <Home className="mr-2 h-4 w-4" />
                    Go Home
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

export function ApiErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('API Error:', error, errorInfo);
      }}
      fallback={({ error, resetError }) => (
        <div className="border-destructive/20 bg-destructive/5 rounded-md border p-4">
          <div className="text-destructive flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <p className="text-sm font-medium">Failed to load data</p>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">{error.message}</p>
          <Button
            onClick={resetError}
            variant="outline"
            size="sm"
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

export function ChunkErrorBoundary({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary
      fallback={({ resetError }) => (
        <div className="border-muted flex flex-col items-center gap-4 rounded-md border p-8 text-center">
          <AlertTriangle className="text-muted-foreground h-8 w-8" />
          <div>
            <h3 className="text-lg font-medium">Component failed to load</h3>
            <p className="text-muted-foreground text-sm">
              This section couldn't be displayed due to a loading error.
            </p>
          </div>
          <Button onClick={resetError} variant="outline">
            Try again
          </Button>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}
