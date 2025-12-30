import { Component } from "react";
import type { ReactNode, ErrorInfo } from "react";
import { ErrorDisplay } from "@/components/ErrorDisplay";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-6">
          <ErrorDisplay
            title="Application Error"
            message={
              this.state.error?.message || 
              "An unexpected error occurred. Please try refreshing the page."
            }
            onRetry={this.handleReset}
            retryLabel="Reset"
          />
        </div>
      );
    }

    return this.props.children;
  }
}
