import React from "react";

interface Props {
  children: React.ReactNode;
  /** When true, renders a minimal full-page fallback (for the outermost boundary, before the app shell exists). */
  fullPage?: boolean;
}

interface State {
  error: Error | null;
}

/**
 * Catches render crashes so a bug on one page shows a recoverable message
 * instead of a silent blank screen. Two instances are used: one wraps the
 * whole app (catches anything, even a crash before the sidebar mounts) and
 * one wraps just the routed page content, keyed by the current path, so a
 * crash on one page doesn't take down navigation to the rest of the app.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("Content OS crashed:", error, info.componentStack);
  }

  resetData = () => {
    try {
      localStorage.removeItem("content-os-store");
    } catch {
      // ignore — best effort
    }
    window.location.hash = "#/";
    window.location.reload();
  };

  reload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;

    const body = (
      <div className="card max-w-md px-6 py-6 text-center">
        <h1 className="text-base font-semibold text-base-100">Something went wrong</h1>
        <p className="mt-2 text-xs text-base-400">
          This page hit an unexpected error{this.props.fullPage ? "" : " — the rest of the app should still work"}.
        </p>
        <p className="mt-2 rounded-lg bg-base-850 px-3 py-2 text-left text-[11px] text-base-500 break-words">
          {this.state.error.message}
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <button className="btn-secondary" onClick={this.reload}>
            Reload
          </button>
          <button className="btn-ghost !text-red-400" onClick={this.resetData}>
            Reset app data &amp; reload
          </button>
        </div>
        <p className="mt-3 text-[10px] text-base-600">
          "Reset app data" clears everything saved in this browser (videos, ideas, settings) and starts fresh.
        </p>
      </div>
    );

    if (this.props.fullPage) {
      return <div className="flex min-h-screen items-center justify-center bg-base-950 p-6">{body}</div>;
    }
    return <div className="flex items-center justify-center py-16">{body}</div>;
  }
}
