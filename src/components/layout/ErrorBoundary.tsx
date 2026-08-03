"use client";

import { Component, ReactNode } from "react";

interface Props { children: ReactNode; }
interface State { hasError: boolean; errorMsg: string; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, errorMsg: "" };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMsg: error.message || "Something went wrong" };
  }

  componentDidCatch(error: Error) {
    console.error("ErrorBoundary caught:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center">
            <span className="text-2xl">⚠️</span>
          </div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Page Error</h1>
          <p className="text-zinc-500 text-sm max-w-sm">{this.state.errorMsg}</p>
          <button
            onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
            className="px-6 py-2.5 rounded-full text-white bg-gradient-to-r from-pink-500 to-rose-500 text-sm font-medium hover:shadow-lg transition-all"
          >
            Reload Page
          </button>
          <a href="/" className="text-pink-500 text-sm hover:underline">Go to Home</a>
        </div>
      );
    }
    return this.props.children;
  }
}
