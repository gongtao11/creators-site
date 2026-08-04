"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { ArrowLeft, MessageCircle, Mail, Send, Loader2, ChevronRight } from "lucide-react";

interface Message { id: string; sender_id: string | null; receiver_id: string;
  content: string; is_ai: boolean; created_at: string; user_email?: string; }
interface Thread { userId: string; email: string; msgCount: number; messages: Message[]; lastDate: string; }

export default function AdminContactsPage() {
  return <AuthGuard requireAdmin fallbackPath="/"><ContactsContent /></AuthGuard>;
}

function ContactsContent() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [viewUserId, setViewUserId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/contacts");
      if (r.ok) {
        const d = await r.json();
        setThreads(d.threads || []);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const uid = params.get("user");
    if (uid) setViewUserId(uid);
    loadData();
  }, [loadData]);

  const selectedThread = viewUserId ? threads.find(t => t.userId === viewUserId) : null;

  const handleReply = async () => {
    if (!replyText.trim() || !viewUserId) return;
    setSending(true);
    try {
      await fetch("/api/admin/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: viewUserId, content: replyText.trim() }),
      });
      setReplyText("");
      await loadData();
    } catch {}
    setSending(false);
  };

  // Keyboard submit
  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleReply(); }
  };

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

        {viewUserId && selectedThread ? (
          <>
            <button onClick={() => setViewUserId(null)} className="inline-flex items-center gap-1 text-sm text-pink-500 hover:text-pink-600 mb-4">
              <ArrowLeft className="w-3 h-3" /> Back to all
            </button>
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border p-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center text-white font-bold">
                  {selectedThread.email[0]?.toUpperCase() || "?"}
                </div>
                <div>
                  <p className="font-bold text-sm">{selectedThread.email}</p>
                  <p className="text-xs text-zinc-400">{selectedThread.msgCount} messages</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="space-y-3 max-h-[55vh] overflow-y-auto mb-4 px-1">
              {selectedThread.messages.map((msg) => {
                const isCreator = (msg.content || "").startsWith("[Creator]");
                const displayContent = isCreator
                  ? msg.content.slice("[Creator]".length).trim()
                  : msg.content;
                const isAi = msg.is_ai && !isCreator;

                return (
                  <div key={msg.id} className={`flex flex-col ${isCreator ? "items-end" : "items-start"}`}>
                    {/* Label */}
                    <span className={`text-[10px] font-bold mb-0.5 px-2 ${
                      isCreator ? "text-pink-500" : isAi ? "text-pink-400" : "text-blue-500"
                    }`}>
                      {isCreator ? "You" : isAi ? "AI" : selectedThread.email.split("@")[0]}
                    </span>
                    {/* Bubble */}
                    <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                      isCreator
                        ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-br-sm shadow-md"
                        : isAi
                          ? "bg-pink-50 dark:bg-zinc-800 border border-pink-200 dark:border-pink-900 rounded-bl-sm"
                          : "bg-blue-50 dark:bg-zinc-800 border border-blue-200 dark:border-blue-900 rounded-bl-sm"
                    }`}>
                      <p className={`text-sm whitespace-pre-wrap ${isCreator ? "text-white" : "text-zinc-800 dark:text-zinc-200"}`}>
                        {displayContent}
                      </p>
                      <p className={`text-[9px] mt-1 ${isCreator ? "text-white/60 text-right" : "text-zinc-400"}`}>
                        {new Date(msg.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reply input */}
            <div className="flex gap-2 items-end bg-white dark:bg-zinc-900 rounded-2xl border p-3 sticky bottom-0">
              <textarea
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                onKeyDown={handleKey}
                rows={2}
                placeholder={`Reply to ${selectedThread.email}...`}
                className="flex-1 px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-pink-500/50"
              />
              <button
                onClick={handleReply}
                disabled={sending || !replyText.trim()}
                className="shrink-0 px-5 py-2.5 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white text-sm font-bold disabled:opacity-50 flex items-center gap-1.5 shadow-lg hover:shadow-pink-500/30 transition-all"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Reply
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-6">
              <h1 className="text-2xl font-bold">Fan Messages</h1>
              <span className="text-sm text-zinc-400">{threads.length} conversations</span>
            </div>

            {threads.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-2xl border">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 text-zinc-300" />
                <p className="text-zinc-500">No messages yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {threads.sort((a, b) => b.lastDate.localeCompare(a.lastDate)).map((t) => (
                  <button key={t.userId} onClick={() => setViewUserId(t.userId)}
                    className="w-full text-left bg-white dark:bg-zinc-900 rounded-2xl border p-4 hover:border-pink-300 dark:hover:border-pink-700 transition-all group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center text-white font-bold text-sm">
                          {t.email[0]?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <p className="font-semibold text-sm flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5 text-zinc-400" /> {t.email}
                          </p>
                          <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">
                            {t.messages[t.messages.length - 1]?.content?.slice(0, 80)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-xs text-zinc-500">{t.msgCount} msgs</p>
                          <p className="text-[10px] text-zinc-400">{new Date(t.lastDate).toLocaleDateString()}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-pink-400 transition-colors" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
