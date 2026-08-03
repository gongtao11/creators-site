"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  children?: ReactNode;
  variant?: "primary" | "outline" | "danger";
}

export function StableButton({ loading, children, variant = "primary", className = "", disabled, ...props }: Props) {
  const base = "py-2.5 rounded-full text-sm font-medium flex items-center justify-center gap-2 transition-all";
  const variants: Record<string, string> = {
    primary: "bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:shadow-lg",
    outline: "border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300",
    danger: "text-red-500 hover:bg-red-50 dark:hover:bg-red-950",
  };

  return (
    <button
      className={`${base} ${variants[variant]} disabled:opacity-50 ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="w-4 h-4 animate-spin shrink-0" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      <span className="shrink-0">{children}</span>
    </button>
  );
}
