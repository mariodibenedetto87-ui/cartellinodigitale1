import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Aggiorna lo stato in modo che il prossimo render mostri l'UI di fallback
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Logga l'errore su un servizio di monitoring (Sentry, LogRocket, etc.)
    console.error('Uncaught error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // TODO: Invia l'errore a un servizio di monitoring
    // Esempio: Sentry.captureException(error);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 md:p-12">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <svg 
                  className="w-10 h-10 text-red-600 dark:text-red-400" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                  />
                </svg>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-4">
              Oops! Qualcosa è andato storto
            </h1>

            {/* Description */}
            <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
              Si è verificato un errore inaspettato. Non preoccuparti, i tuoi dati sono al sicuro.
              Prova a ricaricare la pagina o torna alla homepage.
            </p>

            {/* Error Details (only in development) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <summary className="cursor-pointer text-red-800 dark:text-red-300 font-semibold mb-2">
                  Dettagli errore (solo in sviluppo)
                </summary>
                <div className="mt-4 text-sm">
                  <p className="font-mono text-red-700 dark:text-red-400 mb-2">
                    {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <pre className="mt-2 p-2 bg-white dark:bg-gray-900 rounded text-xs overflow-auto max-h-48 text-gray-800 dark:text-gray-300">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </details>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={this.handleReload}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                🔄 Ricarica Pagina
              </button>
              <button
                onClick={this.handleGoHome}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                🏠 Torna alla Home
              </button>
            </div>

            {/* Support Link */}
            <p className="text-center text-sm text-gray-500 dark:text-gray-500 mt-8">
              Se il problema persiste,{' '}
              <a 
                href="mailto:support@timecardpro.com" 
                className="text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                contatta il supporto
              </a>
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
