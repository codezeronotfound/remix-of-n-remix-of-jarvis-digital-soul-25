import React from "react";

type State = { hasError: boolean; error?: Error | null };

export default class ErrorBoundary extends React.Component<{ children?: React.ReactNode }, State> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    // In a real app you might log to an error reporting service here
    // console.error("ErrorBoundary caught:", error, info);
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-100 p-6">
          <div className="max-w-lg text-center">
            <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
            <pre className="text-sm bg-slate-800 p-3 rounded mb-4">{String(this.state.error)}</pre>
            <button onClick={this.reset} className="px-4 py-2 rounded bg-emerald-600">
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children ?? null;
  }
}
