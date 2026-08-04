"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { Loader2 } from "lucide-react";
import type { Message } from "@/types";

interface Props {
  initialMessages?: Message[];
  currentUserId: string;
}

export function ChatWindow({ initialMessages = [], currentUserId }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(
    async (content: string) => {
      setLoading(true);

      
      const tempUserMsg: Message = {
        id: `temp-${Date.now()}`,
        sender_id: currentUserId,
        receiver_id: currentUserId,
        content,
        is_ai: false,
        trigger_keyword: null,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, tempUserMsg]);

      try {
        const { supabase } = await import("@/lib/supabase");
        const { data: { session } } = await supabase.auth.getSession();
        const accessToken = session?.access_token || "";

        const res = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, accessToken }),
        });

        if (!res.ok) throw new Error("Failed to send");

        const data = await res.json();

        
        setMessages((prev) => {
          const without = prev.filter((m) => m.id !== tempUserMsg.id);
          return [
            ...without,
            data.userMessage,
            {
              id: data.aiReply.id || `ai-${Date.now()}`,
              sender_id: null,
              receiver_id: currentUserId,
              content: data.aiReply.content,
              is_ai: true,
              trigger_keyword: data.aiReply.trigger_keyword || null,
              created_at: data.aiReply.created_at || new Date().toISOString(),
            },
          ];
        });
      } catch (error) {
        console.error("Send message failed:", error);
        
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempUserMsg.id
              ? { ...m, content: m.content + " (failed to send)" }
              : m
          )
        );
      } finally {
        setLoading(false);
      }
    },
    [currentUserId]
  );

  return (
    <div className="flex flex-col h-full">
      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-zinc-400 dark:text-zinc-500">
            <div className="text-4xl mb-3">💬</div>
            <p className="text-sm font-medium">Start a conversation!</p>
            <p className="text-xs mt-1">Send me a message and I'll reply right away 💕</p>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isOwn={!!msg.sender_id && msg.sender_id === currentUserId}
          />
        ))}

        {/* AI typing indicator */}
        {loading && (
          <div className="flex justify-start mb-4">
            <div className="bg-zinc-100 dark:bg-zinc-800 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* 输入框 */}
      <ChatInput onSend={handleSend} disabled={loading} />
    </div>
  );
}
