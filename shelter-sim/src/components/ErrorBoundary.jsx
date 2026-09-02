import React from 'react';
import { AlertOctagon, RotateCcw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled React Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#F0F7FF] p-6 text-slate-900">
          <div className="max-w-md rounded-2xl border border-rose-300 bg-white p-6 text-center shadow-xl">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-700 border border-rose-200">
              <AlertOctagon className="h-6 w-6" />
            </div>
            <h2 className="mb-2 text-base font-bold text-slate-900">Component Render Exception</h2>
            <p className="mb-4 text-xs text-rose-800 font-mono break-words bg-rose-50 p-3 rounded-xl border border-rose-200">
              {this.state.error?.message || 'An unexpected rendering error occurred.'}
            </p>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0284C7] px-5 py-2 text-xs font-bold text-white hover:bg-[#0369A1] shadow-sm transition-all"
            >
              <RotateCcw className="h-4 w-4" />
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
