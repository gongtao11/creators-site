"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Navbar } from "@/components/layout/Navbar";
import { MessageCircle, Loader2, ChevronRight } from "lucide-react";
import type { Message, Profile } from "@/types";

export default function MessagesPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [conversations, setConversations] = useState<
    { userId: string; lastMessage: string; lastMessageAt: string; unread: number }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setProfile(profileData as Profile | null);

      
      try {
        const res = await fetch("/api/messages");
        if (res.ok) {
          const data = await res.json();
          setConversations(data.conversations || []);
        }
      } catch (error) {
        console.error("Failed to load messages:", error);
      }

      setLoading(false);
    }
    load();
  }, [router]);

  if (loading) {
    return (
      <>
        <Navbar user={null} />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
        </main>
      </>
    );
  }

  
  const hasConversations = conversations.length > 0;

  return (
    <>
      <Navbar
        user={
          profile
            ? { id: profile.id, username: profile.username, isAdmin: profile.is_admin }
            : null
        }
      />
      <main className="flex-1 max-w-2xl mx-auto px-4 py-8 w-full">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Messages</h1>
          {!hasConversations && (
            <Link
              href={`/messages/new`}
              className="text-sm font-medium text-pink-500 hover:text-pink-600"
            >
              New Message
            </Link>
          )}
        </div>

        {!hasConversations ? (
          /* 没有会话：显示新对话入口 */
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-pink-100 dark:bg-pink-950 flex items-center justify-center mx-auto mb-6">
              <MessageCircle className="w-10 h-10 text-pink-500" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Start a Conversation</h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-6 max-w-xs mx-auto">
              Send me a message! I reply to every fan personally (with a little AI help 😉)
            </p>
            <Link
              href="/messages/new"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-white bg-gradient-to-r from-pink-500 to-rose-500 hover:shadow-lg hover:shadow-pink-500/25 transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              Send First Message
            </Link>
          </div>
        ) : (
          /* 会话列表 */
          <div className="space-y-1">
            {conversations.map((conv) => (
              <Link
                key={conv.userId}
                href={`/messages/default`}
                className="flex items-center gap-3 p-4 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center text-white font-bold text-lg shrink-0">
                  {conv.userId === "ai" ? "💕" : conv.userId[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm">
                      {conv.userId === "ai" ? "Creator" : "You"}
                    </p>
                    <span className="text-xs text-zinc-400">
                      {formatDate(conv.lastMessageAt)}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">
                    {conv.lastMessage}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-400 shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 24 * 60 * 60 * 1000) {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
