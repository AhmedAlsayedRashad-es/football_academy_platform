import { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackPath?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: { componentStack: string } | null;
  showDetails: boolean;
  retryCount: number;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    this.setState({ errorInfo });
    // Log to console for debugging (not shown to user)
    console.error("[ErrorBoundary] Caught error:", error);
    console.error("[ErrorBoundary] Component stack:", errorInfo.componentStack);
  }

  handleRetry = () => {
    this.setState(prev => ({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      retryCount: prev.retryCount + 1,
    }));
  };

  handleGoHome = () => {
    window.location.href = this.props.fallbackPath || '/dashboard';
  };

  handleReload = () => {
    window.location.reload();
  };

  toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, showDetails, retryCount } = this.state;
      const isArabic = document.documentElement.lang === 'ar';

      return (
        <div
          className="min-h-screen flex items-center justify-center p-4 bg-background"
          dir={isArabic ? 'rtl' : 'ltr'}
        >
          <div className="w-full max-w-lg">
            {/* Icon + Title */}
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                <AlertTriangle className="w-10 h-10 text-destructive" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                {isArabic ? 'حدث خطأ غير متوقع' : 'Something went wrong'}
              </h1>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
                {isArabic
                  ? 'نعتذر عن هذا الخطأ. يمكنك المحاولة مرة أخرى أو العودة للوحة التحكم.'
                  : 'We apologize for the inconvenience. You can try again or return to the dashboard.'}
              </p>
              {retryCount > 0 && (
                <p className="text-xs text-muted-foreground/60 mt-2">
                  {isArabic ? `محاولة رقم ${retryCount}` : `Retry attempt #${retryCount}`}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <button
                onClick={this.handleRetry}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
              >
                <RefreshCw className="w-4 h-4" />
                {isArabic ? 'إعادة المحاولة' : 'Try Again'}
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-secondary text-secondary-foreground font-medium hover:opacity-90 transition-opacity"
              >
                <Home className="w-4 h-4" />
                {isArabic ? 'لوحة التحكم' : 'Go to Dashboard'}
              </button>
            </div>

            {/* Reload option */}
            <div className="text-center mb-6">
              <button
                onClick={this.handleReload}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
              >
                {isArabic ? 'إعادة تحميل الصفحة بالكامل' : 'Reload the entire page'}
              </button>
            </div>

            {/* Error Details (collapsible, for developers) */}
            {error && (
              <div className="border border-border rounded-lg overflow-hidden">
                <button
                  onClick={this.toggleDetails}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm text-muted-foreground hover:bg-muted/50 transition-colors"
                >
                  <span className="font-medium">
                    {isArabic ? 'تفاصيل الخطأ (للمطورين)' : 'Error Details (for developers)'}
                  </span>
                  {showDetails
                    ? <ChevronUp className="w-4 h-4" />
                    : <ChevronDown className="w-4 h-4" />
                  }
                </button>
                {showDetails && (
                  <div className="px-4 pb-4 bg-muted/30">
                    <div className="mt-2 p-3 rounded bg-muted overflow-auto max-h-48">
                      <p className="text-xs font-mono text-destructive font-semibold mb-1">
                        {error.name}: {error.message}
                      </p>
                      {errorInfo?.componentStack && (
                        <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-all mt-2">
                          {errorInfo.componentStack.trim().split('\n').slice(0, 8).join('\n')}
                        </pre>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground/60 mt-2">
                      {isArabic
                        ? 'يرجى مشاركة هذه المعلومات مع فريق الدعم الفني.'
                        : 'Please share this information with the technical support team.'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
