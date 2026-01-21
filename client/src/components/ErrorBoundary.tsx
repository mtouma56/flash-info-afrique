import { cn } from "@/lib/utils";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
    }
    // In production, you would send this to an error tracking service like Sentry
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="flex items-center justify-center min-h-screen p-8 bg-background"
          role="alert"
          aria-live="assertive"
        >
          <div className="flex flex-col items-center w-full max-w-2xl p-8 text-center">
            <AlertTriangle
              size={48}
              className="text-destructive mb-6 flex-shrink-0"
              aria-hidden="true"
            />

            <h1 className="text-2xl font-bold text-foreground mb-2 font-['Sora']">
              Une erreur inattendue s'est produite
            </h1>
            
            <p className="text-muted-foreground mb-6">
              Nous sommes désolés pour ce désagrément. Veuillez actualiser la page ou retourner à l'accueil.
            </p>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="w-full mb-6">
                <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground mb-2">
                  Détails techniques (développement uniquement)
                </summary>
                <div className="p-4 w-full rounded bg-muted overflow-auto text-left">
                  <pre className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                    {this.state.error.stack}
                  </pre>
                </div>
              </details>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => window.location.reload()}
                className={cn(
                  "flex items-center justify-center gap-2 px-6 py-3 rounded-lg",
                  "bg-primary text-primary-foreground",
                  "hover:opacity-90 cursor-pointer transition-opacity",
                  "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                )}
              >
                <RotateCcw size={16} aria-hidden="true" />
                Actualiser la page
              </button>
              
              <button
                onClick={() => (window.location.href = "/")}
                className={cn(
                  "flex items-center justify-center gap-2 px-6 py-3 rounded-lg",
                  "border border-border bg-background text-foreground",
                  "hover:bg-muted cursor-pointer transition-colors",
                  "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                )}
              >
                <Home size={16} aria-hidden="true" />
                Retour à l'accueil
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
