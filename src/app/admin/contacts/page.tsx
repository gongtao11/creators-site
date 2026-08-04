"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { ArrowLeft, MessageCircle, Mail, Clock, Send, Loader2, ChevronRight, ArrowRight } from "lucide-react";

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

  // Reply state per user
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  // View: "list" or a specific user's conversation
  const [viewUser, setViewUser] = useState<string | null>(null);

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

  // Group by user
  const userMap = new Map<string, { email: string; messages: Message[]; lastDate: string }>();
  for (const msg of messages) {
    const key = msg.sender_id || "unknown";
    if (!userMap.has(key)) {
      userMap.set(key, { email: msg.user_email || key, messages: [], lastDate: "" });
    }
    const entry = userMap.get(key)!;
    entry.messages.push(msg);
    if (msg.created_at > entry.lastDate) entry.lastDate = msg.created_at;
  }

  const users = Array.from(userMap.entries()).map(([id, data]) => ({
    id, ...data, msgCount: data.messages.length,
    messages: data.messages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
  }));

  const selectedUser = viewUser ? users.find(u => u.id === viewUser) : null;

  const handleReply = async (userId: string) => {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      await fetch("/api/admin/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, content: replyText.trim() }),
      });
      setReplyText("");
      setReplyTo(null);
      await loadMessages();
    } catch {}
    setSending(false);
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

        {viewUser && selectedUser ? (
          /* Single user conversation view */
          <>
            <button onClick={() => setViewUser(null)} className="inline-flex items-center gap-1 text-sm text-pink-500 hover:text-pink-600 mb-4">
              <ArrowLeft className="w-3 h-3" /> Back to all conversations
            </button>
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border p-4 mb-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center text-white font-bold">
                  {selectedUser.email[0]?.toUpperCase() || "?"}
                </div>
                <div>
                  <p className="font-bold text-sm">{selectedUser.email}</p>
                  <p className="text-xs text-zinc-400">{selectedUser.msgCount} messages</p>
                </div>
              </div>
            </div>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto mb-4">
              {selectedUser.messages.map((msg) => (
                <div key={msg.id} className={`rounded-2xl px-4 py-3 ${msg.is_ai
                  ? "bg-pink-50/50 dark:bg-pink-950/20 border border-pink-100 dark:border-pink-900 mr-8"
                  : msg.sender_id === viewUser
                    ? "bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 ml-8"
                    : "bg-green-50/50 dark:bg-green-950/20 border border-green-100 dark:border-green-900 ml-8"
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      msg.is_ai ? "bg-pink-100 dark:bg-pink-950 text-pink-600" :
                      msg.sender_id === viewUser ? "bg-blue-100 dark:bg-blue-950 text-blue-600" :
                      "bg-green-100 dark:bg-green-950 text-green-600"
                    }`}>
                      {msg.is_ai ? "AI" : msg.sender_id === viewUser ? "Fan" : "You"}
                    </span>
                    <span className="text-[10px] text-zinc-400">{new Date(msg.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              ))}
            </div>
            {/* Reply box */}
            <div className="flex gap-2 items-end">
              <textarea
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                rows={2}
                placeholder="Reply as yourself (not AI)..."
                className="flex-1 px-3 py-2.5 rounded-xl border bg-white dark:bg-zinc-800 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-pink-500/50"
              />
              <button
                onClick={() => handleReply(viewUser)}
                disabled={sending || !replyText.trim()}
                className="shrink-0 px-4 py-2.5 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white text-sm font-medium disabled:opacity-50 flex items-center gap-1"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send
              </button>
            </div>
          </>
        ) : (
          /* Conversation list */
          <>
            <div className="flex items-center gap-3 mb-6">
              <h1 className="text-2xl font-bold">Fan Messages</h1>
              <span className="text-sm text-zinc-400">{users.length} conversations</span>
            </div>

            {users.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-2xl border">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 text-zinc-300" />
                <p className="text-zinc-500">No messages yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {users.sort((a, b) => new Date(b.lastDate).getTime() - new Date(a.lastDate).getTime()).map((u) => (
                  <button
                    key={u.id}
                    onClick={() => setViewUser(u.id)}
                    className="w-full text-left bg-white dark:bg-zinc-900 rounded-2xl border p-4 hover:border-pink-300 dark:hover:border-pink-700 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center text-white font-bold text-sm">
                          {u.email[0]?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <p className="font-semibold text-sm flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5 text-zinc-400" />
                            {u.email}
                          </p>
                          <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">
                            {u.messages[u.messages.length - 1]?.content?.slice(0, 80)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-xs text-zinc-500">{u.msgCount} msgs</p>
                          <p className="text-[10px] text-zinc-400">{new Date(u.lastDate).toLocaleDateString()}</p>
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
