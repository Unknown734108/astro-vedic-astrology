import React from 'react';

/**
 * ErrorBoundary.jsx
 *
 * Phase 5 (P5.11) production-readiness addition: without this, an
 * unexpected runtime error anywhere in the component tree (e.g.
 * malformed imported profile data slipping past validation) unmounts
 * the whole app and leaves a blank white screen with no recovery path.
 *
 * This does not touch any existing component, calculation, or state —
 * it only wraps the mount point in main.jsx. Errors are still logged to
 * the console for real diagnosis (never hidden), and the fallback UI
 * offers a genuine recovery action (reload) rather than a dead end.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Intentionally not swallowed — real errors still need to reach the console.
    console.error('ASTRO crashed:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-sm w-full p-6 rounded-3xl bg-slate-900/80 border border-rose-800/50 text-center space-y-3">
            <h1 className="text-lg font-bold text-white">Something went wrong</h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              ASTRO hit an unexpected error and couldn't continue rendering. Your saved
              profiles and journal entries are untouched in this browser's storage.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors"
            >
              Reload ASTRO
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
