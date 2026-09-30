import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Janavaaj runtime error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-6 text-slate-800">
          <div className="max-w-md w-full bg-white rounded-2xl border border-[#E8E6E0] p-6 shadow-xl text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Application Error</h2>
            <p className="text-xs text-slate-500">
              A runtime issue prevented the page from rendering normally.
            </p>
            {this.state.error && (
              <div className="p-3 rounded-lg bg-red-50/60 border border-red-200 text-left overflow-auto max-h-36">
                <p className="text-xs font-mono text-red-700 font-semibold">{this.state.error.message}</p>
                {this.state.error.stack && (
                  <pre className="text-[10px] text-red-500 font-mono mt-1 whitespace-pre-wrap">
                    {this.state.error.stack.split('\n').slice(0, 3).join('\n')}
                  </pre>
                )}
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="flex-1 py-2 px-4 rounded-xl bg-[#3346B8] text-white text-xs font-bold hover:bg-[#4054C5] transition-colors flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reload Application
              </button>
              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.href = '/login';
                }}
                className="py-2 px-4 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
              >
                <Home className="w-3.5 h-3.5" /> Go to Login
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
