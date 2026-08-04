"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Navbar } from "@/components/layout/Navbar";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { ArrowLeft, Loader2 } from "lucide-react";
import type { Profile, Message } from "@/types";

export default function NewMessagePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadMessages, setLoadMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/login"; return; }

      const { data: profileData } = await supabase
        .from("profiles").select("*").eq("id", user.id).single();
      setProfile(profileData as Profile | null);

      // Load chat history
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token || "";
        const res = await fetch(`/api/messages?token=${encodeURIComponent(token)}`);
        if (res.ok) {
          const d = await res.json();
          // Get all messages for this user, flatten and sort
          const allMsgs = (d.messages || []).sort(
            (a: Message, b: Message) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
          setLoadMessages(allMsgs);
        }
      } catch {}

      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        user={{ id: profile.id, username: profile.username, isAdmin: profile.is_admin }}
      />
      <main className="flex-1 max-w-2xl mx-auto w-full flex flex-col">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <Link href="/messages" className="text-zinc-500 hover:text-zinc-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center text-white text-lg">
            💕
          </div>
          <div>
            <p className="font-semibold text-sm">Chat with me</p>
            <p className="text-xs text-green-500">Replies instantly 💋</p>
          </div>
        </div>
        <div className="flex-1 overflow-hidden bg-white dark:bg-zinc-950">
          <ChatWindow initialMessages={loadMessages} currentUserId={profile.id} />
        </div>
      </main>
    </div>
  );
}
