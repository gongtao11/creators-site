"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Navbar } from "@/components/layout/Navbar";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import type { Profile, Message } from "@/types";

export default function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
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

      // 加载该会话的消息
      const { data: messagesData } = await supabase
        .from("messages")
        .select("*")
        .eq("receiver_id", user.id)
        .order("created_at", { ascending: true });

      setMessages((messagesData as Message[]) || []);
      setLoading(false);
    }
    load();
  }, [router, resolvedParams.id]);

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

  if (!profile) return null;

  return (
    <>
      <Navbar
        user={{ id: profile.id, username: profile.username, isAdmin: profile.is_admin }}
      />
      <main className="flex-1 max-w-2xl mx-auto w-full flex flex-col">
        {/* Chat header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
          <Link href="/messages" className="text-zinc-500 hover:text-zinc-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center text-white text-sm font-bold">
              💕
            </div>
            <div>
              <p className="font-semibold text-sm">Chat with me</p>
              <p className="text-xs text-zinc-400">Replies instantly 💋</p>
            </div>
          </div>
        </div>

        {/* Chat */}
        <div className="flex-1 overflow-hidden">
          <ChatWindow initialMessages={messages} currentUserId={profile.id} />
        </div>
      </main>
    </>
  );
}
