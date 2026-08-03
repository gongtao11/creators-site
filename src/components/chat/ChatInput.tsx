"use client";

import { useState } from "react";
import { Send, Loader2 } from "lucide-react";

interface Props {
  onSend: (message: string) => Promise<void>;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: Props) {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || sending || disabled) return;

    setSending(true);
    setInput("");
    try {
      await onSend(trimmed);
    } finally {
      setSending(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 border-t border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-3"
    >
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type a message..."
        disabled={disabled || sending}
        className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-full px-4 py-2.5 text-sm
                   text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400
                   focus:outline-none focus:ring-2 focus:ring-pink-500/50
                   disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={!input.trim() || sending || disabled}
        className="shrink-0 p-2.5 rounded-full bg-gradient-to-r from-pink-500 to-rose-500
                   text-white disabled:opacity-50 disabled:cursor-not-allowed
                   hover:shadow-lg hover:shadow-pink-500/25 transition-all"
      >
        {sending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
      </button>
    </form>
  );
}
