import * as React from 'react';
import {
  EmptyState,
  EmptyStateFooter,
  EmptyStateBody,
  EmptyStateActions,
  Button,
  PageSection,
  Title,
} from '@patternfly/react-core';
import { ExclamationTriangleIcon } from '@patternfly/react-icons';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error to console in development
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Update state with error details
    this.setState({
      error,
      errorInfo,
    });

    // TODO: Log error to monitoring service (e.g., Sentry, LogRocket)
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    // Call custom reset handler if provided
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <PageSection>
          <EmptyState>
            <ExclamationTriangleIcon style={{ fontSize: '3rem', color: '#f0ab00', marginBottom: '16px' }} />
            <Title headingLevel="h1" size="lg">Something went wrong</Title>
            <EmptyStateBody>
              {process.env.NODE_ENV === 'development' && this.state.error ? (
                <div style={{ textAlign: 'left', maxWidth: '600px', margin: '0 auto' }}>
                  <p style={{ marginBottom: '16px', color: '#6b7280' }}>
                    An error occurred in the application. See details below:
                  </p>
                  <div
                    style={{
                      background: '#f3f4f6',
                      padding: '16px',
                      borderRadius: '4px',
                      fontSize: '14px',
                      overflow: 'auto',
                      maxHeight: '300px',
                    }}
                  >
                    <div style={{ marginBottom: '12px' }}>
                      <strong>Error:</strong>
                      <pre style={{ margin: '4px 0', color: '#dc2626' }}>
                        {this.state.error.toString()}
                      </pre>
                    </div>
                    {this.state.errorInfo && (
                      <div>
                        <strong>Component Stack:</strong>
                        <pre style={{ margin: '4px 0', fontSize: '12px', color: '#374151' }}>
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p>
                  We're sorry, but something went wrong. Please try refreshing the page or contact
                  support if the problem persists.
                </p>
              )}
            </EmptyStateBody>
            <EmptyStateFooter>
              <EmptyStateActions>
                <Button variant="primary" onClick={this.handleReset}>
                  Try Again
                </Button>
                <Button variant="link" onClick={() => window.location.reload()}>
                  Refresh Page
                </Button>
              </EmptyStateActions>
            </EmptyStateFooter>
          </EmptyState>
        </PageSection>
      );
    }

    return this.props.children;
  }
}

// Functional wrapper for easier usage
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode,
  onReset?: () => void
): React.FC<P> => {
  const WrappedComponent: React.FC<P> = (props) => (
    <ErrorBoundary fallback={fallback} onReset={onReset}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name || 'Component'})`;

  return WrappedComponent;
};
