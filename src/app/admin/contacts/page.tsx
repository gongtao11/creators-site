"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { ArrowLeft, MessageCircle, Mail, Clock } from "lucide-react";

interface Message { id: string; sender_id: string | null; receiver_id: string;
  content: string; is_ai: boolean; created_at: string; user_email?: string; }

export default function AdminContactsPage() {
  return (
    <AuthGuard requireAdmin fallbackPath="/">
      <ContactsContent />
    </AuthGuard>
  );
}

function ContactsContent() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMessages = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/contacts");
      if (r.ok) {
        const d = await r.json();
        setMessages(d.messages || []);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { loadMessages(); }, [loadMessages]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <svg className="w-8 h-8 animate-spin text-pink-500" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={null} />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full">
        <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 mb-4">
          <ArrowLeft className="w-3 h-3" /> Admin
        </Link>
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-2xl font-bold">Fan Messages</h1>
          <span className="text-sm text-zinc-400">{messages.length} messages</span>
        </div>

        {messages.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-2xl border">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 text-zinc-300" />
            <p className="text-zinc-500">No messages yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className={`rounded-2xl p-4 border ${msg.is_ai
                ? "bg-pink-50/50 dark:bg-pink-950/20 border-pink-100 dark:border-pink-900 ml-8"
                : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 mr-8"}`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${msg.is_ai
                    ? "bg-pink-100 dark:bg-pink-950 text-pink-600"
                    : "bg-blue-100 dark:bg-blue-950 text-blue-600"}`}>
                    {msg.is_ai ? "AI Reply" : "Fan"}
                  </span>
                  <span className="text-xs text-zinc-400 flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {msg.user_email || "unknown"}
                  </span>
                  <span className="text-xs text-zinc-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(msg.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{msg.content}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
