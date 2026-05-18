import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class NewTabErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, message: '' };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    const message = error instanceof Error ? error.message : String(error);
    return { hasError: true, message };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error('NewTab crashed:', error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="newtab-error-screen" role="alert">
        <div className="newtab-error-card">
          <h1>Something went wrong</h1>
          <p>{this.state.message || 'The new tab page crashed unexpectedly.'}</p>
          <button type="button" onClick={this.handleReload}>Reload</button>
        </div>
      </div>
    );
  }
}
